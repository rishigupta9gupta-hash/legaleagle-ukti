import React, { useEffect, useRef } from 'react';

const AudioVisualizer = ({ analyser, color = '#22d3ee', isActive = true, height = 60, width = 200 }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !analyser || !isActive) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            if (!isActive) return;

            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, width, height);

            const barWidth = (width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * height;

                ctx.fillStyle = color;
                // Draw rounded bars
                ctx.beginPath();
                ctx.roundRect(x, height - barHeight, barWidth, barHeight, 2);
                ctx.fill();

                x += barWidth + 1;
            }
        };

        draw();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [analyser, isActive, color, height, width]);

    // Handle inactive state (draw a flat line)
    useEffect(() => {
        if (!isActive && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, width, height);

            // Draw flat line
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.strokeStyle = '#52525b'; // zinc-600
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }, [isActive, height, width]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="rounded-lg opacity-80"
        />
    );
};

export default AudioVisualizer;
