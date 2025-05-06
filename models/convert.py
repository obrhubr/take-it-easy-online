import torch
import torch.onnx

# Load your model
model = torch.load("model.pkl", weights_only=False, map_location="cpu")
model.eval()

onnx_path = "model.onnx"
torch.onnx.export(
    model,
    torch.zeros((171), dtype=torch.float),
    onnx_path,
    opset_version=11
)