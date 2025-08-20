import React, { useRef, useEffect, useState } from 'react';

const Visualization = ({ imageFilename, coordinates, expressionValues, isLoading }) => {
    const canvasRef = useRef(null);
    const [transform, setTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const imageRef = useRef(null); // Use a ref to hold the image object

    // Function to draw the legend, which is always in screen space
    const drawLegend = (context, min, max) => {
        const legendHeight = 200;
        const legendWidth = 20;
        const x = context.canvas.width - 50;
        const y = 20;

        context.font = '12px Arial';
        context.fillStyle = 'black';
        context.fillText(max.toFixed(2), x + legendWidth + 5, y + 10);
        context.fillText(min.toFixed(2), x + legendWidth + 5, y + legendHeight);

        const gradient = context.createLinearGradient(0, y, 0, y + legendHeight);
        gradient.addColorStop(0, 'red');
        gradient.addColorStop(1, 'blue');

        context.fillStyle = gradient;
        context.fillRect(x, y, legendWidth, legendHeight);
    };

    const getColor = (value, min, max) => {
        if (max <= min) return 'rgba(0, 0, 255, 0.7)'; // Default to blue
        const normalized = (value - min) / (max - min);
        const red = Math.round(255 * normalized);
        const blue = Math.round(255 * (1 - normalized));
        return `rgba(${red}, 0, ${blue}, 0.7)`;
    };

    // This effect handles the drawing logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Save the untransformed context state
        context.save();

        // Apply the current transformation
        context.translate(transform.offsetX, transform.offsetY);
        context.scale(transform.scale, transform.scale);

        // Draw the image if it's loaded
        if (imageRef.current && imageRef.current.complete) {
            context.drawImage(imageRef.current, 0, 0);
        }

        // Draw the spatial coordinates
        if (coordinates && coordinates.length > 0) {
            const hasExpressionData = expressionValues && expressionValues.length === coordinates.length;
            let minExp = 0, maxExp = 1;
            if (hasExpressionData) {
                minExp = Math.min(...expressionValues);
                maxExp = Math.max(...expressionValues);
            }

            coordinates.forEach(([x, y], index) => {
                if (hasExpressionData) {
                    context.fillStyle = getColor(expressionValues[index], minExp, maxExp);
                } else {
                    context.fillStyle = 'rgba(128, 128, 128, 0.5)';
                }
                context.beginPath();
                // Adjust radius based on scale so points don't become huge/tiny
                context.arc(x, y, 3 / transform.scale, 0, 2 * Math.PI);
                context.fill();
            });
        }

        // Restore the context to its original state
        context.restore();

        // Draw the legend on top of everything, in screen space
        if (expressionValues && expressionValues.length > 0) {
            const minExp = Math.min(...expressionValues);
            const maxExp = Math.max(...expressionValues);
            drawLegend(context, minExp, maxExp);
        }

    }, [transform, coordinates, expressionValues]); // Redraw whenever these change

    // This effect handles loading the image and setting up the canvas size
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!imageFilename || !canvas) return;

        const img = new Image();
        imageRef.current = img;
        img.src = `http://localhost:8000/images/${imageFilename}`;
        img.onload = () => {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
            // Fit image to view initially
            const scaleX = canvas.width / img.width;
            const scaleY = canvas.height / img.height;
            const initialScale = Math.min(scaleX, scaleY) * 0.9;
            const offsetX = (canvas.width - img.width * initialScale) / 2;
            const offsetY = (canvas.height - img.height * initialScale) / 2;
            setTransform({ scale: initialScale, offsetX, offsetY });
        };
    }, [imageFilename]);

    // This effect sets up all the event listeners for interactivity
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleWheel = (e) => {
            e.preventDefault();
            const scaleAmount = 1 - e.deltaY * 0.001;
            const newScale = Math.min(Math.max(0.1, transform.scale * scaleAmount), 20);

            const mouseX = e.clientX - canvas.getBoundingClientRect().left;
            const mouseY = e.clientY - canvas.getBoundingClientRect().top;

            const mouseWorldX = (mouseX - transform.offsetX) / transform.scale;
            const mouseWorldY = (mouseY - transform.offsetY) / transform.scale;

            const newOffsetX = mouseX - mouseWorldX * newScale;
            const newOffsetY = mouseY - mouseWorldY * newScale;

            setTransform({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
        };

        const handleMouseDown = (e) => {
            setIsPanning(true);
            setPanStart({
                x: e.clientX - transform.offsetX,
                y: e.clientY - transform.offsetY,
            });
        };

        const handleMouseUp = () => setIsPanning(false);
        const handleMouseLeave = () => setIsPanning(false);

        const handleMouseMove = (e) => {
            if (!isPanning) return;
            const newOffsetX = e.clientX - panStart.x;
            const newOffsetY = e.clientY - panStart.y;
            setTransform(t => ({ ...t, offsetX: newOffsetX, offsetY: newOffsetY }));
        };

        canvas.addEventListener('wheel', handleWheel);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        canvas.addEventListener('mousemove', handleMouseMove);

        return () => {
            canvas.removeEventListener('wheel', handleWheel);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            canvas.removeEventListener('mousemove', handleMouseMove);
        };
    }, [isPanning, panStart, transform]);

    return (
        <div className="visualization-container">
            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Loading Data...</p>
                </div>
            )}
            <div className="visualization">
                <h2>Visualization</h2>
                <canvas ref={canvasRef} style={{ width: '100%', height: '500px', backgroundColor: '#eee' }} />
                {!imageFilename && <p>Upload files to begin.</p>}
            </div>
        </div>
    );
};

export default Visualization;
