"""
Event Bus — Kafka Producer and Consumer Logic
═════════════════════════════════════════════
Handles asynchronous communication across ScamShastra services.
"""

from typing import Any, Callable, Dict
import json
import logging
from confluent_kafka import Producer, Consumer, KafkaError, KafkaException

from app.config import settings

logger = logging.getLogger(__name__)

class KafkaEventBus:
    """Manages Kafka connections for outbound and inbound events."""

    _producer: Producer | None = None
    _consumer: Consumer | None = None
    _handlers: Dict[str, Callable[[dict], None]] = {}

    @classmethod
    def get_producer(cls) -> Producer:
        if cls._producer is None:
            cls._producer = Producer({
                'bootstrap.servers': settings.kafka_bootstrap_servers,
                'client.id': 'ScamShastra-backend'
            })
        return cls._producer

    @classmethod
    def get_consumer(cls) -> Consumer:
        if cls._consumer is None:
            cls._consumer = Consumer({
                'bootstrap.servers': settings.kafka_bootstrap_servers,
                'group.id': 'ScamShastra-processor',
                'auto.offset.reset': 'earliest'
            })
        return cls._consumer

    # ─── Outbound Events ──────────────────────────────────────────────────

    @classmethod
    def emit(cls, topic: str, payload: dict) -> None:
        """Publish an event to a Kafka topic."""
        producer = cls.get_producer()
        try:
            producer.produce(
                topic=topic,
                value=json.dumps(payload).encode('utf-8'),
                callback=cls._delivery_report
            )
            producer.poll(0)
        except Exception as e:
            logger.error(f"Failed to emit event to {topic}: {e}")

    @staticmethod
    def _delivery_report(err, msg):
        """Callback for message delivery."""
        if err is not None:
            logger.error(f"Message delivery failed: {err}")
        else:
            logger.debug(f"Message delivered to {msg.topic()} [{msg.partition()}]")

    # ─── Specific Emitters ────────────────────────────────────────────────

    @classmethod
    def emit_mule_detected(cls, account_id: str, mps_score: float, signals: list):
        cls.emit("fraud.mule.detected", {
            "account_id": account_id,
            "mps_score": mps_score,
            "signals": signals,
            "timestamp": "now" # In real app, use isoformat
        })

    @classmethod
    def emit_ring_identified(cls, ring_id: str, member_ids: list, estimated_value: float, activated_at: str):
        cls.emit("fraud.ring.identified", {
            "ring_id": ring_id,
            "member_ids": member_ids,
            "estimated_value": estimated_value,
            "activated_at": activated_at
        })

    @classmethod
    def emit_layering_confirmed(cls, path_id: str, lrs_score: float, hops: list, amount: float, time_window: float):
        cls.emit("fraud.layering.confirmed", {
            "path_id": path_id,
            "lrs_score": lrs_score,
            "hops": hops,
            "amount": amount,
            "time_window": time_window
        })

    @classmethod
    def emit_str_ready(cls, str_id: str, account_ids: list, trigger: str, assigned_to: str):
        cls.emit("compliance.str.ready", {
            "str_id": str_id,
            "account_ids": account_ids,
            "trigger": trigger,
            "assigned_to": assigned_to
        })

    # ─── Inbound Event Listeners ──────────────────────────────────────────

    @classmethod
    def register_handler(cls, topic: str, handler: Callable[[dict], None]):
        """Register a callback for a specific topic."""
        cls._handlers[topic] = handler

    @classmethod
    def start_listening(cls):
        """Start the Kafka consumer loop (Run in background task)."""
        if not cls._handlers:
            return

        consumer = cls.get_consumer()
        consumer.subscribe(list(cls._handlers.keys()))

        try:
            while True:
                msg = consumer.poll(1.0)
                if msg is None:
                    continue
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        raise KafkaException(msg.error())

                topic = msg.topic()
                try:
                    payload = json.loads(msg.value().decode('utf-8'))
                    if topic in cls._handlers:
                        cls._handlers[topic](payload)
                except Exception as e:
                    logger.error(f"Error processing message from {topic}: {e}")
        finally:
            consumer.close()

# ─── Default Event Handlers ───────────────────────────────────────────────

def handle_account_flagged(payload: dict):
    """external flag from partner bank → trigger MPS rescore"""
    account_id = payload.get("account_id")
    logger.info(f"Received account.flagged for {account_id}. Triggering MPS rescore...")
    # Trigger MPS scoring logic

def handle_transaction_ingested(payload: dict):
    """new transaction → update graph + run incremental scoring"""
    tx_id = payload.get("transaction_id")
    logger.info(f"Received transaction.ingested {tx_id}. Updating graph...")
    # Update Neo4j

def handle_investigation_opened(payload: dict):
    """external case ID → link to graph subgraph"""
    case_id = payload.get("case_id")
    logger.info(f"Received investigation.opened {case_id}.")
    # Link subgraph

# Register defaults
KafkaEventBus.register_handler("account.flagged", handle_account_flagged)
KafkaEventBus.register_handler("transaction.ingested", handle_transaction_ingested)
KafkaEventBus.register_handler("investigation.opened", handle_investigation_opened)

