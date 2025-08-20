from fastapi.testclient import TestClient
from ..main import app # Use relative import to get the app

client = TestClient(app)

def test_read_main_is_not_found():
    """
    Tests that the root path returns a 404, as we haven't defined it.
    This is a simple smoke test.
    """
    response = client.get("/")
    assert response.status_code == 404
    assert response.json() == {"detail": "Not Found"}

def test_invalid_image_is_not_found():
    """
    Tests that requesting a non-existent image returns a 404.
    """
    response = client.get("/images/non_existent_image.png")
    assert response.status_code == 404
    assert response.json() == {"detail": "Image not found."}
