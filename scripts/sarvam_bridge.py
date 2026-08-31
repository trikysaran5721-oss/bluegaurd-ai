import sys
import json
import os
import base64
from sarvamai import SarvamAI

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No action specified"}))
        sys.exit(1)

    action = sys.argv[1]
    api_key = os.environ.get("SARVAM_API_KEY", "sk_txs4qqro_FPF9Hxl7iXvMSE8yhkr5O8vG")

    client = SarvamAI(api_subscription_key=api_key)

    if action == "synthesize":
        # Reads JSON input from stdin
        raw_input = sys.stdin.read()
        data = json.loads(raw_input) if raw_input else {}
        text = data.get("text", "Hello Mariner")
        lang = data.get("target_language_code", "ta-IN")
        speaker = data.get("speaker", "kavitha")

        try:
          res = client.text_to_speech.convert(
              text=text,
              language_code=lang,
              speaker=speaker
          )
          # res.audios is list of base64 wav strings
          audio_b64 = res.audios[0] if hasattr(res, "audios") and res.audios else None
          print(json.dumps({
              "audio_base64": audio_b64,
              "target_language_code": lang,
              "provider": "SarvamAI Python SDK 0.1.31a4 (bulbul)"
          }))
        except Exception as e:
          print(json.dumps({
              "audio_base64": None,
              "error": str(e),
              "provider": "SarvamAI SDK Fallback"
          }))

    elif action == "translate":
        raw_input = sys.stdin.read()
        data = json.loads(raw_input) if raw_input else {}
        text = data.get("input", data.get("text", ""))
        src_lang = data.get("source_language_code", "auto")
        tgt_lang = data.get("target_language_code", "ta-IN")

        try:
          res = client.text.translate(
              input=text,
              source_language_code=src_lang,
              target_language_code=tgt_lang
          )
          translated = getattr(res, "translated_text", text)
          print(json.dumps({
              "translated_text": translated,
              "source_language_code": src_lang,
              "target_language_code": tgt_lang,
              "provider": "SarvamAI Python SDK 0.1.31a4 (mayura)"
          }))
        except Exception as e:
          print(json.dumps({
              "translated_text": text,
              "error": str(e),
              "provider": "SarvamAI SDK Fallback"
          }))

    elif action == "transcribe":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "No audio file provided"}))
            sys.exit(1)
        file_path = sys.argv[2]
        try:
            with open(file_path, "rb") as f:
                res = client.speech_to_text.transcribe(
                    file=f,
                    model="saaras:v3"
                )
            transcript = getattr(res, "transcript", "")
            lang_code = getattr(res, "language_code", "ta-IN")
            print(json.dumps({
                "transcript": transcript,
                "language_code": lang_code,
                "provider": "SarvamAI Python SDK 0.1.31a4 (saaras)"
            }))
        except Exception as e:
            print(json.dumps({
                "transcript": "",
                "error": str(e),
                "provider": "SarvamAI SDK Fallback"
            }))

if __name__ == "__main__":
    main()
