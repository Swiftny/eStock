FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 \
    HF_HOME=/models/hf \
    MODEL_DIR=/models
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY model /models
RUN python -c "import json; from huggingface_hub import snapshot_download; \
info = json.load(open('/models/evidence/run_info.json')); \
snapshot_download(info['base_model'], revision=info['base_revision'])"
COPY handler.py .
CMD ["python", "handler.py"]