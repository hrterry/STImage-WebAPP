import React, { useState } from 'react';
import './App.css';
import ControlPanel from './components/ControlPanel';
import Visualization from './components/Visualization';

function App() {
    const [h5adFilename, setH5adFilename] = useState('');
    const [imageFilename, setImageFilename] = useState('');
    const [coordinates, setCoordinates] = useState([]);
    const [geneNames, setGeneNames] = useState([]);
    const [expressionValues, setExpressionValues] = useState([]);
    const [selectedGene, setSelectedGene] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchCoordinates = async (h5ad) => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`http://localhost:8000/process/${h5ad}`);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Failed to process file.');
            }
            const data = await response.json();
            setCoordinates(data.coordinates);
            setGeneNames(data.gene_names);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchExpression = async (gene) => {
        if (!gene || !h5adFilename) return;
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`http://localhost:8000/expression/${h5adFilename}/${gene}`);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Failed to fetch expression data.');
            }
            const data = await response.json();
            setExpressionValues(data.expression_values);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadSuccess = (h5ad, image) => {
        setH5adFilename(h5ad);
        setImageFilename(image);
        setCoordinates([]);
        setGeneNames([]);
        setExpressionValues([]);
        setSelectedGene('');
        fetchCoordinates(h5ad);
    };

    const handleGeneSelect = (gene) => {
        setSelectedGene(gene);
        fetchExpression(gene);
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Spatial Transcriptomics Visualization</h1>
            </header>
            <main className="App-main">
                <ControlPanel
                    onUploadSuccess={handleUploadSuccess}
                    geneNames={geneNames}
                    onGeneSelect={handleGeneSelect}
                    selectedGene={selectedGene}
                    isLoading={isLoading}
                />
                <Visualization
                    imageFilename={imageFilename}
                    coordinates={coordinates}
                    expressionValues={expressionValues}
                    isLoading={isLoading}
                />
            </main>
            {error && <p className="error-message">Error: {error}</p>}
        </div>
    );
}

export default App;
