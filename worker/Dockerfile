# Select and pin the CUDA-compatible image digest during the deployment spike.
FROM pytorch/pytorch:2.7.1-cuda12.8-cudnn9-runtime
WORKDIR /worker
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY handler.py .
CMD ["python", "-u", "handler.py"]
