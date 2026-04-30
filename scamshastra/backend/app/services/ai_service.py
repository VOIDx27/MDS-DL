import google.generativeai as genai
from app.config import settings

class AIService:
    _initialized = False

    @classmethod
    def _init_ai(cls):
        if not cls._initialized:
            if settings.gemini_api_key and settings.gemini_api_key != "your_gemini_api_key_here":
                genai.configure(api_key=settings.gemini_api_key)
                cls._initialized = True
            else:
                print("⚠ Gemini API key not configured. AI services will be mocked.")

    @classmethod
    def generate_risk_narrative(cls, accounts_data, total_amount, hop_count):
        cls._init_ai()
        
        prompt = f"""
        Act as an expert Anti-Money Laundering (AML) analyst for the FIU (Financial Intelligence Unit).
        Generate a professional, detailed, and concise Risk Narrative for a Suspicious Transaction Report (STR).
        
        Network Details:
        - Number of Accounts: {len(accounts_data)}
        - Total Transaction Volume: ₹{total_amount:,}
        - Hops between accounts: {hop_count}
        
        Account Details (VPA, Bank, KYC Tier):
        {chr(10).join([f"- {a['vpa']} ({a['bank']}), KYC: {a['kycTier']}" for a in accounts_data])}
        
        The narrative should highlight:
        1. Indicators of layering (e.g., high velocity, multi-hop chains).
        2. Potential money mule activity.
        3. Regulatory concerns (RBI/PMLA).
        
        Keep the tone formal and investigative.
        """

        if not cls._initialized:
            # Mocked response if no API key
            return f"[AI-MOCKED] The investigated network involves {len(accounts_data)} accounts with a cumulative volume of ₹{total_amount:,}. " \
                   f"The topology exhibits {hop_count} hops, which is highly consistent with layering patterns used in UPI mule rings. " \
                   f"Subject accounts {', '.join([a['vpa'] for a in accounts_data[:2]])} appear to be central transit nodes."

        try:
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Error generating AI narrative: {e}")
            return f"Error generating narrative: {str(e)}"
