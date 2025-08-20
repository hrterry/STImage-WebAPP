import os
from fastapi import FastAPI, File, UploadFile, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
import shutil
import anndata
import numpy as np
import json
from scipy.sparse import issparse

# Define the directory to store uploaded files
UPLOAD_DIRECTORY = "uploads"
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

app = FastAPI()

# Add CORS middleware to allow cross-origin requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.post("/upload/")
async def upload_files(
    h5ad_file: UploadFile = File(...),
    image_file: UploadFile = File(...)
):
    """
    Receives and saves an h5ad file and a corresponding image file.
    """
    try:
        # Define file paths
        h5ad_path = os.path.join(UPLOAD_DIRECTORY, h5ad_file.filename)
        image_path = os.path.join(UPLOAD_DIRECTORY, image_file.filename)

        # Save the uploaded files
        with open(h5ad_path, "wb") as buffer:
            shutil.copyfileobj(h5ad_file.file, buffer)

        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image_file.file, buffer)

        return {
            "message": "Files uploaded successfully",
            "h5ad_filename": h5ad_file.filename,
            "image_filename": image_file.filename,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")

@app.get("/process/{h5ad_filename}")
async def process_h5ad_file(h5ad_filename: str):
    """
    Reads an h5ad file and returns gene names and spatial coordinates.
    """
    file_path = os.path.join(UPLOAD_DIRECTORY, h5ad_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="H5AD file not found.")

    try:
        adata = anndata.read_h5ad(file_path)

        # Extract gene names
        gene_names = adata.var_names.tolist()

        # Extract spatial coordinates
        if 'spatial' not in adata.obsm:
            raise HTTPException(status_code=400, detail="'spatial' key not found in .obsm of the h5ad file.")

        coordinates = adata.obsm['spatial'].tolist()

        return {
            "gene_names": gene_names,
            "coordinates": coordinates
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process h5ad file: {e}")

@app.get("/images/{image_filename}")
async def get_image(image_filename: str):
    """
    Serves an uploaded image file.
    """
    file_path = os.path.join(UPLOAD_DIRECTORY, image_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found.")

    with open(file_path, "rb") as f:
        image_bytes = f.read()

    # Determine media type from file extension
    media_type = "image/jpeg"
    if image_filename.lower().endswith(".png"):
        media_type = "image/png"
    elif image_filename.lower().endswith(".gif"):
        media_type = "image/gif"

    return Response(content=image_bytes, media_type=media_type)

@app.get("/expression/{h5ad_filename}/{gene_name}")
async def get_expression(h5ad_filename: str, gene_name: str):
    """
    Returns the expression values for a specific gene.
    """
    file_path = os.path.join(UPLOAD_DIRECTORY, h5ad_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="H5AD file not found.")

    try:
        adata = anndata.read_h5ad(file_path)

        # Find the index of the gene
        gene_list = adata.var_names.tolist()
        if gene_name not in gene_list:
            raise HTTPException(status_code=404, detail=f"Gene '{gene_name}' not found.")

        gene_index = gene_list.index(gene_name)

        # Get expression data for the gene
        expression_data = adata.X[:, gene_index]

        # If the data is in a sparse matrix, convert it to a dense array
        if issparse(expression_data):
            expression_data = expression_data.toarray().flatten()

        return {"expression_values": expression_data.tolist()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get expression data: {e}")
