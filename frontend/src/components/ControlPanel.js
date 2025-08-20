import React, { useState } from 'react';

const ControlPanel = ({ onUploadSuccess, geneNames, onGeneSelect, selectedGene, isLoading }) => {
    const [h5adFile, setH5adFile] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [message, setMessage] = useState('');

    const handleH5adFileChange = (e) => {
        setH5adFile(e.target.files[0]);
    };

    const handleImageFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!h5adFile || !imageFile) {
            setMessage('Please select both an h5ad file and an image file.');
            return;
        }

        const formData = new FormData();
        formData.append('h5ad_file', h5adFile);
        formData.append('image_file', imageFile);

        setMessage('Uploading...');

        try {
            const response = await fetch('http://localhost:8000/upload/', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            setMessage(data.message);
            onUploadSuccess(data.h5ad_filename, data.image_filename);
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <div className="control-panel">
            <h2>Controls</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>H5AD File (.h5ad):</label>
                    <input type="file" accept=".h5ad" onChange={handleH5adFileChange} disabled={isLoading} />
                </div>
                <div>
                    <label>Image File:</label>
                    <input type="file" accept="image/*" onChange={handleImageFileChange} disabled={isLoading} />
                </div>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Uploading...' : 'Upload'}
                </button>
            </form>
            {message && <p>{message}</p>}

            {geneNames && geneNames.length > 0 && (
                <div className="gene-selection">
                    <hr />
                    <h3>Select Gene</h3>
                    <select value={selectedGene} onChange={(e) => onGeneSelect(e.target.value)} disabled={isLoading}>
                        <option value="">-- Select a Gene --</option>
                        {geneNames.map(gene => (
                            <option key={gene} value={gene}>{gene}</option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};

export default ControlPanel;
