"""
FraudGraph — Synthetic Seed Data Generator
═══════════════════════════════════════════

Populates Neo4j with:
  • 500 Accounts  (with realistic Indian UPI metadata)
  • ~120 Devices   (some shared to simulate device-reuse red-flags)
  • 2000 Transactions (normal + fraud-ring activity)
  • 3 embedded Fraud Rings:
      Ring A  "Smurfing Cluster"  — 10 members, many small round-trips
      Ring B  "Layering Chain"    — 15 members, sequential pass-through chain
      Ring C  "Collector Hub"     —  8 members, star topology into one collector
  • LINKED_TO edges between accounts sharing mobile hashes

Usage:
  pip install neo4j faker
  python seed.py                          # defaults to bolt://localhost:7687
  python seed.py --uri bolt://neo4j:7687  # inside Docker network
  python seed.py --clear                  # wipe DB first
"""

import argparse
import hashlib
import os
import random
import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path

try:
    from neo4j import GraphDatabase
except ImportError:
    sys.exit("neo4j driver not installed. Run: pip install neo4j")

try:
    from faker import Faker
except ImportError:
    sys.exit("faker not installed. Run: pip install faker")


# ─── Constants ────────────────────────────────────────────────────────────────

INDIAN_BANKS = [
    "SBI", "HDFC", "ICICI", "Axis", "Kotak", "PNB",
    "BOB", "Canara", "IndusInd", "Yes Bank", "IDBI",
    "Union Bank", "Federal Bank", "RBL", "Bandhan",
]

UPI_APPS = ["GPay", "PhonePe", "Paytm", "BHIM", "CRED", "Amazon Pay", "WhatsApp Pay"]

UPI_HANDLES = [
    "@okaxis", "@oksbi", "@okhdfcbank", "@okicici", "@ybl",
    "@paytm", "@ibl", "@upi", "@axl", "@kotak",
]

KYC_TIERS = ["FULL", "MIN", "NONE"]
KYC_WEIGHTS = [0.55, 0.35, 0.10]

TRANSACTION_STATUSES = ["SUCCESS", "FAILED", "REVERSED"]
TX_STATUS_WEIGHTS = [0.92, 0.05, 0.03]

INDIAN_CITIES = [
    ("Mumbai", "Maharashtra"), ("Delhi", "Delhi"), ("Bangalore", "Karnataka"),
    ("Hyderabad", "Telangana"), ("Chennai", "Tamil Nadu"), ("Kolkata", "West Bengal"),
    ("Pune", "Maharashtra"), ("Ahmedabad", "Gujarat"), ("Jaipur", "Rajasthan"),
    ("Lucknow", "Uttar Pradesh"), ("Surat", "Gujarat"), ("Nagpur", "Maharashtra"),
    ("Indore", "Madhya Pradesh"), ("Bhopal", "Madhya Pradesh"),
    ("Chandigarh", "Chandigarh"), ("Kochi", "Kerala"), ("Coimbatore", "Tamil Nadu"),
    ("Vadodara", "Gujarat"), ("Vizag", "Andhra Pradesh"), ("Patna", "Bihar"),
]

DEVICE_MODELS = [
    "Samsung Galaxy A14", "Samsung Galaxy M34", "Samsung Galaxy S24",
    "Xiaomi Redmi Note 13", "Xiaomi 14", "Realme 12 Pro",
    "OnePlus Nord CE 4", "OnePlus 12", "Vivo V30",
    "Oppo Reno 11", "iPhone 15", "iPhone 14", "iPhone 13",
    "Motorola G84", "Nothing Phone 2a", "Poco X6",
]

SEED = 42
random.seed(SEED)
fake = Faker("en_IN")
Faker.seed(SEED)

NOW = datetime(2026, 4, 28, 12, 0, 0)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def uid() -> str:
    return uuid.uuid4().hex[:12]


def make_vpa(name: str) -> str:
    clean = name.lower().replace(" ", "").replace(".", "")[:12]
    suffix = random.choice(UPI_HANDLES)
    return f"{clean}{random.randint(1, 99)}{suffix}"


def hash_mobile(phone: str) -> str:
    return hashlib.sha256(phone.encode()).hexdigest()[:16]


def random_datetime(days_back: int = 365) -> datetime:
    return NOW - timedelta(
        days=random.randint(0, days_back),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
        seconds=random.randint(0, 59),
    )


def iso(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%dT%H:%M:%S")


def random_amount(low: float = 10.0, high: float = 50000.0) -> float:
    """Log-normal-ish distribution skewing toward smaller amounts."""
    return round(random.lognormvariate(7.5, 1.5) % high + low, 2)


def fraud_amount(low: float = 500.0, high: float = 9500.0) -> float:
    """Amounts just below reporting thresholds (smurfing pattern)."""
    return round(random.uniform(low, high), 2)


# ─── Data Generation ─────────────────────────────────────────────────────────

def generate_accounts(n: int = 500):
    accounts = []
    used_vpas = set()

    for i in range(n):
        name = fake.name()
        phone = fake.phone_number()
        vpa = make_vpa(name)

        # Ensure uniqueness
        while vpa in used_vpas:
            vpa = make_vpa(name + str(random.randint(100, 999)))
        used_vpas.add(vpa)

        created = random_datetime(days_back=730)
        age_days = (NOW - created).days

        accounts.append({
            "id": uid(),
            "vpa": vpa,
            "bank": random.choice(INDIAN_BANKS),
            "kycTier": random.choices(KYC_TIERS, weights=KYC_WEIGHTS, k=1)[0],
            "accountAge": age_days,
            "mobileHash": hash_mobile(phone),
            "deviceIds": [],  # filled later
            "createdAt": iso(created),
            "muleScore": 0.0,
            "isFlagged": False,
            "ringId": None,
            "_name": name,
            "_phone": phone,
        })

    return accounts


def generate_devices(n: int = 120):
    devices = []
    for _ in range(n):
        devices.append({
            "imei": fake.bothify("##-######-######-#"),
            "model": random.choice(DEVICE_MODELS),
            "registeredVpas": [],
        })
    return devices


def assign_devices(accounts, devices):
    """Assign 1-2 devices per account. Some devices are shared (suspicious)."""
    for acc in accounts:
        # 80% get 1 device, 20% get 2
        count = 1 if random.random() < 0.8 else 2
        chosen = random.sample(devices, k=count)
        for dev in chosen:
            acc["deviceIds"].append(dev["imei"])
            dev["registeredVpas"].append(acc["vpa"])


def create_fraud_rings(accounts):
    """
    Embed 3 fraud rings inside the first ~33 accounts (indices chosen to
    keep ring members non-overlapping).
    """
    rings = []

    # ── Ring A: Smurfing Cluster (10 members) ─────────────────────────────
    ring_a_members = accounts[0:10]
    ring_a_id = f"RING-{uid()}"
    rings.append({
        "ringId": ring_a_id,
        "detectedAt": iso(NOW - timedelta(days=3)),
        "memberCount": 10,
        "estimatedValue": 0.0,  # computed after txns
        "status": "ACTIVE",
        "type": "smurfing",
        "members": ring_a_members,
    })
    for m in ring_a_members:
        m["ringId"] = ring_a_id
        m["isFlagged"] = True
        m["kycTier"] = random.choice(["MIN", "NONE"])
        m["muleScore"] = round(random.uniform(0.70, 0.95), 2)

    # ── Ring B: Layering Chain (15 members) ───────────────────────────────
    ring_b_members = accounts[10:25]
    ring_b_id = f"RING-{uid()}"
    rings.append({
        "ringId": ring_b_id,
        "detectedAt": iso(NOW - timedelta(days=7)),
        "memberCount": 15,
        "estimatedValue": 0.0,
        "status": "ACTIVE",
        "type": "layering",
        "members": ring_b_members,
    })
    for m in ring_b_members:
        m["ringId"] = ring_b_id
        m["isFlagged"] = True
        m["kycTier"] = random.choice(["MIN", "NONE"])
        m["muleScore"] = round(random.uniform(0.65, 0.90), 2)

    # ── Ring C: Collector Hub (8 members, 1 collector) ────────────────────
    ring_c_members = accounts[25:33]
    ring_c_id = f"RING-{uid()}"
    rings.append({
        "ringId": ring_c_id,
        "detectedAt": iso(NOW - timedelta(days=1)),
        "memberCount": 8,
        "estimatedValue": 0.0,
        "status": "FROZEN",
        "type": "collector",
        "members": ring_c_members,
    })
    # First member is the collector — highest mule score
    ring_c_members[0]["muleScore"] = 0.98
    ring_c_members[0]["isFlagged"] = True
    for m in ring_c_members:
        m["ringId"] = ring_c_id
        m["isFlagged"] = True
        if m["muleScore"] == 0.0:
            m["muleScore"] = round(random.uniform(0.55, 0.85), 2)
        m["kycTier"] = random.choice(["MIN", "NONE"])

    return rings


def generate_transactions(accounts, rings, total: int = 2000):
    """
    Generate a mix of:
      - Normal P2P/P2M transactions (~1500)
      - Ring A smurfing txns (~200)
      - Ring B layering txns  (~200)
      - Ring C collector txns (~100)
    """
    txns = []
    used_utrs = set()

    def make_utr():
        utr = f"UTR{fake.bothify('############')}"
        while utr in used_utrs:
            utr = f"UTR{fake.bothify('############')}"
        used_utrs.add(utr)
        return utr

    ring_a = rings[0]
    ring_b = rings[1]
    ring_c = rings[2]

    # ── Ring A: Smurfing — random pairs, small amounts, high frequency ────
    ring_a_value = 0.0
    for _ in range(200):
        sender, receiver = random.sample(ring_a["members"], 2)
        amt = fraud_amount(200, 9500)
        ring_a_value += amt
        ts = random_datetime(days_back=14)
        city, state = random.choice(INDIAN_CITIES[:5])  # concentrated geography

        txns.append({
            "utr": make_utr(),
            "amount": amt,
            "timestamp": iso(ts),
            "upiApp": random.choice(["GPay", "PhonePe", "Paytm"]),
            "bank": sender["bank"],
            "city": city,
            "state": state,
            "status": "SUCCESS",
            "senderVpa": sender["vpa"],
            "receiverVpa": receiver["vpa"],
        })
    ring_a["estimatedValue"] = round(ring_a_value, 2)

    # ── Ring B: Layering — sequential chain A→B→C→D→...→N ────────────────
    ring_b_value = 0.0
    chain = ring_b["members"]
    for _ in range(200):
        # Pick a random starting point in the chain
        start_idx = random.randint(0, len(chain) - 2)
        hop_len = random.randint(2, min(5, len(chain) - start_idx))
        base_amount = fraud_amount(5000, 49000)
        ts = random_datetime(days_back=21)
        city, state = random.choice(INDIAN_CITIES)

        for hop in range(hop_len - 1):
            # Each hop skims ~5-10%
            skim = random.uniform(0.90, 0.95)
            amt = round(base_amount * skim, 2)
            base_amount = amt
            ring_b_value += amt
            hop_ts = ts + timedelta(minutes=random.randint(1, 30) * (hop + 1))

            txns.append({
                "utr": make_utr(),
                "amount": amt,
                "timestamp": iso(hop_ts),
                "upiApp": random.choice(UPI_APPS),
                "bank": chain[start_idx + hop]["bank"],
                "city": city,
                "state": state,
                "status": "SUCCESS",
                "senderVpa": chain[start_idx + hop]["vpa"],
                "receiverVpa": chain[start_idx + hop + 1]["vpa"],
            })
    ring_b["estimatedValue"] = round(ring_b_value, 2)

    # ── Ring C: Collector — all feeders send to member[0] ─────────────────
    ring_c_value = 0.0
    collector = ring_c["members"][0]
    feeders = ring_c["members"][1:]
    for _ in range(100):
        feeder = random.choice(feeders)
        amt = fraud_amount(1000, 25000)
        ring_c_value += amt
        ts = random_datetime(days_back=7)
        city, state = random.choice(INDIAN_CITIES[:3])

        txns.append({
            "utr": make_utr(),
            "amount": amt,
            "timestamp": iso(ts),
            "upiApp": random.choice(["PhonePe", "GPay"]),
            "bank": feeder["bank"],
            "city": city,
            "state": state,
            "status": "SUCCESS",
            "senderVpa": feeder["vpa"],
            "receiverVpa": collector["vpa"],
        })
    ring_c["estimatedValue"] = round(ring_c_value, 2)

    # ── Normal transactions to fill up to 2000 ───────────────────────────
    fraud_count = len(txns)
    normal_count = total - fraud_count
    non_ring_accounts = accounts[33:]  # accounts outside any ring

    for _ in range(normal_count):
        sender = random.choice(non_ring_accounts)
        receiver = random.choice(accounts)
        while receiver["vpa"] == sender["vpa"]:
            receiver = random.choice(accounts)

        amt = random_amount(10, 50000)
        ts = random_datetime(days_back=90)
        city, state = random.choice(INDIAN_CITIES)
        status = random.choices(TRANSACTION_STATUSES, weights=TX_STATUS_WEIGHTS, k=1)[0]

        txns.append({
            "utr": make_utr(),
            "amount": amt,
            "timestamp": iso(ts),
            "upiApp": random.choice(UPI_APPS),
            "bank": sender["bank"],
            "city": city,
            "state": state,
            "status": status,
            "senderVpa": sender["vpa"],
            "receiverVpa": receiver["vpa"],
        })

    random.shuffle(txns)
    return txns


def find_linked_accounts(accounts):
    """Find accounts sharing the same mobile hash → LINKED_TO edges."""
    by_hash = {}
    for acc in accounts:
        h = acc["mobileHash"]
        by_hash.setdefault(h, []).append(acc)

    links = []
    for h, group in by_hash.items():
        if len(group) > 1:
            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    links.append((group[i]["vpa"], group[j]["vpa"]))
    return links


# ─── Neo4j Ingestion ──────────────────────────────────────────────────────────

def run_schema(session, schema_path: str):
    """Execute each statement from schema.cypher individually."""
    text = Path(schema_path).read_text(encoding="utf-8")
    # Split on semicolons, filter blank / comment-only lines
    statements = [s.strip() for s in text.split(";") if s.strip() and not s.strip().startswith("//")]
    for stmt in statements:
        # Remove leading comment lines within a statement block
        lines = [l for l in stmt.split("\n") if not l.strip().startswith("//")]
        clean = "\n".join(lines).strip()
        if clean:
            session.run(clean)
    print(f"  ✓ Schema applied ({len(statements)} statements)")


def ingest_accounts(session, accounts):
    query = """
    UNWIND $batch AS a
    CREATE (acc:Account {
        id:          a.id,
        vpa:         a.vpa,
        bank:        a.bank,
        kycTier:     a.kycTier,
        accountAge:  a.accountAge,
        mobileHash:  a.mobileHash,
        deviceIds:   a.deviceIds,
        createdAt:   datetime(a.createdAt),
        muleScore:   a.muleScore,
        isFlagged:   a.isFlagged,
        ringId:      a.ringId
    })
    """
    # Strip internal-only keys before sending
    clean = [
        {k: v for k, v in a.items() if not k.startswith("_")}
        for a in accounts
    ]
    # Batch in chunks of 100
    for i in range(0, len(clean), 100):
        session.run(query, batch=clean[i:i + 100])
    print(f"  ✓ {len(accounts)} Account nodes created")


def ingest_devices(session, devices):
    query = """
    UNWIND $batch AS d
    CREATE (dev:Device {
        imei:            d.imei,
        model:           d.model,
        registeredVpas:  d.registeredVpas
    })
    """
    for i in range(0, len(devices), 50):
        session.run(query, batch=devices[i:i + 50])
    print(f"  ✓ {len(devices)} Device nodes created")


def ingest_uses_edges(session, accounts):
    query = """
    UNWIND $batch AS row
    MATCH (a:Account {vpa: row.vpa})
    MATCH (d:Device  {imei: row.imei})
    CREATE (a)-[:USES]->(d)
    """
    edges = []
    for acc in accounts:
        for imei in acc["deviceIds"]:
            edges.append({"vpa": acc["vpa"], "imei": imei})
    for i in range(0, len(edges), 200):
        session.run(query, batch=edges[i:i + 200])
    print(f"  ✓ {len(edges)} USES relationships created")


def ingest_fraud_rings(session, rings):
    # Create FraudRing nodes
    for ring in rings:
        session.run("""
        CREATE (r:FraudRing {
            ringId:         $ringId,
            detectedAt:     datetime($detectedAt),
            memberCount:    $memberCount,
            estimatedValue: $estimatedValue,
            status:         $status
        })
        """,
            ringId=ring["ringId"],
            detectedAt=ring["detectedAt"],
            memberCount=ring["memberCount"],
            estimatedValue=ring["estimatedValue"],
            status=ring["status"],
        )
    print(f"  ✓ {len(rings)} FraudRing nodes created")

    # Create MEMBER_OF edges
    edge_count = 0
    for ring in rings:
        for member in ring["members"]:
            session.run("""
            MATCH (a:Account {vpa: $vpa})
            MATCH (r:FraudRing {ringId: $ringId})
            CREATE (a)-[:MEMBER_OF]->(r)
            """, vpa=member["vpa"], ringId=ring["ringId"])
            edge_count += 1
    print(f"  ✓ {edge_count} MEMBER_OF relationships created")


def ingest_transactions(session, txns):
    # Create Transaction nodes + SENT edges in one go
    query = """
    UNWIND $batch AS t
    MATCH (sender:Account   {vpa: t.senderVpa})
    MATCH (receiver:Account {vpa: t.receiverVpa})
    CREATE (tx:Transaction {
        utr:       t.utr,
        amount:    t.amount,
        timestamp: datetime(t.timestamp),
        upiApp:    t.upiApp,
        bank:      t.bank,
        city:      t.city,
        state:     t.state,
        status:    t.status
    })
    CREATE (sender)-[:SENT {utr: t.utr, amount: t.amount, timestamp: datetime(t.timestamp)}]->(receiver)
    """
    batch_size = 100
    for i in range(0, len(txns), batch_size):
        session.run(query, batch=txns[i:i + batch_size])
    print(f"  ✓ {len(txns)} Transaction nodes + SENT edges created")


def ingest_linked_to(session, links):
    query = """
    UNWIND $batch AS l
    MATCH (a:Account {vpa: l.vpa1})
    MATCH (b:Account {vpa: l.vpa2})
    CREATE (a)-[:LINKED_TO]->(b)
    """
    if links:
        batch = [{"vpa1": v1, "vpa2": v2} for v1, v2 in links]
        for i in range(0, len(batch), 100):
            session.run(query, batch=batch[i:i + 100])
    print(f"  ✓ {len(links)} LINKED_TO relationships created")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="FraudGraph Neo4j seed script")
    parser.add_argument("--uri", default=os.getenv("NEO4J_URI", "bolt://localhost:7687"))
    parser.add_argument("--user", default=os.getenv("NEO4J_USER", "neo4j"))
    parser.add_argument("--password", default=os.getenv("NEO4J_PASSWORD", "fraudgraphpassword"))
    parser.add_argument("--clear", action="store_true", help="Wipe all data before seeding")
    args = parser.parse_args()

    schema_path = str(Path(__file__).parent / "schema.cypher")

    print(f"\n╔══════════════════════════════════════════════╗")
    print(f"║   FraudGraph — Neo4j Seed Data Generator     ║")
    print(f"╚══════════════════════════════════════════════╝\n")

    driver = GraphDatabase.driver(args.uri, auth=(args.user, args.password))

    try:
        driver.verify_connectivity()
        print(f"  ✓ Connected to {args.uri}\n")
    except Exception as e:
        sys.exit(f"  ✗ Cannot connect to Neo4j at {args.uri}: {e}")

    # ── Generate data in memory ───────────────────────────────────────────
    print("▸ Generating synthetic data...")
    accounts = generate_accounts(500)
    devices = generate_devices(120)
    assign_devices(accounts, devices)
    rings = create_fraud_rings(accounts)
    txns = generate_transactions(accounts, rings, total=2000)
    links = find_linked_accounts(accounts)
    print(f"  ✓ Data generated: {len(accounts)} accounts, {len(devices)} devices, "
          f"{len(txns)} transactions, {len(rings)} rings, {len(links)} linked pairs\n")

    # ── Write to Neo4j ────────────────────────────────────────────────────
    with driver.session() as session:
        if args.clear:
            print("▸ Clearing existing data...")
            session.run("MATCH (n) DETACH DELETE n")
            print("  ✓ Database cleared\n")

        print("▸ Applying schema constraints & indexes...")
        run_schema(session, schema_path)
        print()

        print("▸ Ingesting nodes...")
        ingest_accounts(session, accounts)
        ingest_devices(session, devices)
        ingest_fraud_rings(session, rings)
        print()

        print("▸ Ingesting relationships...")
        ingest_uses_edges(session, accounts)
        ingest_transactions(session, txns)
        ingest_linked_to(session, links)
        print()

    driver.close()

    # ── Summary ───────────────────────────────────────────────────────────
    print("╔══════════════════════════════════════════════╗")
    print("║             Seed Complete ✓                  ║")
    print("╠══════════════════════════════════════════════╣")
    for r in rings:
        tag = {"smurfing": "☁  Smurfing", "layering": "⛓  Layering", "collector": "🎯 Collector"}[r["type"]]
        print(f"║  {tag}: {r['memberCount']} members, ₹{r['estimatedValue']:,.2f}  ")
    print(f"║  Total transactions: {len(txns)}")
    print(f"║  Flagged accounts:   {sum(1 for a in accounts if a['isFlagged'])}")
    print(f"╚══════════════════════════════════════════════╝\n")


if __name__ == "__main__":
    main()
