import React, { useState, useEffect } from 'react';

function CustomAudioPlayer({ src, speed, gain, bassBoost = 0 }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioContext, setAudioContext] = useState(null);
    const [audioSource, setAudioSource] = useState(null);
    const [audioBuffer, setAudioBuffer] = useState(null);
    const [pausedAt, setPausedAt] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [gainNode, setGainNode] = useState(null);
    const [bassBoostNode, setBassBoostNode] = useState(null);

    useEffect(() => {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        setAudioContext(context);

        const gNode = context.createGain();
        setGainNode(gNode);

        const bassBoost = context.createBiquadFilter();
        bassBoost.type = 'lowshelf';
        bassBoost.frequency.setValueAtTime(100, context.currentTime);
        setBassBoostNode(bassBoost);

        return () => {
            context.close();
        };
    }, []);

    useEffect(() => {
        if (audioContext) {
            fetch(src)
                .then(response => response.arrayBuffer())
                .then(data => audioContext.decodeAudioData(data))
                .then(buffer => {
                    setDuration(buffer.duration);
                    setAudioBuffer(buffer);
                });
        }
    }, [src, audioContext]);

    useEffect(() => {
        if (bassBoostNode) {
            bassBoostNode.gain.setValueAtTime(bassBoost, audioContext.currentTime);
        }
    }, [bassBoost, bassBoostNode]);

    const playAudioFromPosition = (offset = 0) => {
        if (audioSource) {
            audioSource.stop();
        }
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.playbackRate.setValueAtTime(speed, audioContext.currentTime);

        source.connect(bassBoostNode);
        bassBoostNode.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(gain, audioContext.currentTime);

        setAudioSource(source);

        source.start(0, offset);
        setIsPlaying(true);
        setStartTime(audioContext.currentTime - offset);
    };

    const togglePlay = () => {
        if (isPlaying) {
            audioSource.stop();
            setIsPlaying(false);
        } else {
            playAudioFromPosition(pausedAt);
        }
    };

    useEffect(() => {
        if (audioContext && isPlaying) {
            const updateProgress = setInterval(() => {
                const elapsed = audioContext.currentTime - startTime;
                const progressPercentage = (elapsed / duration) * 100;
                setProgress(progressPercentage);
                setPausedAt(elapsed);
            }, 50);
            return () => clearInterval(updateProgress);
        }
    }, [audioContext, isPlaying, startTime, duration]);

    useEffect(() => {
        if (audioSource && isFinite(speed)) {
            audioSource.playbackRate.setValueAtTime(speed, audioContext.currentTime);
        }
    }, [speed, audioSource, audioContext]);

    useEffect(() => {
        if (gainNode) {
            gainNode.gain.setValueAtTime(gain, audioContext.currentTime);
        }
    }, [gain, gainNode, audioContext]);

    const handleProgressChange = (event) => {
        const newProgress = event.target.value;
        const newTime = (newProgress / 100) * duration;
        setPausedAt(newTime);
        setProgress(newProgress);
        if (isPlaying) {
            audioSource.stop();
            playAudioFromPosition(newTime);
        }
    };

    const formatTime = (time) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="custom-audio-player">
            <button className="play-pause-button" onClick={togglePlay}>
                {isPlaying ? "❚❚" : "▶"}
            </button>
            <div className="progress-container">
                <div className="progress-bar">
                    <div className="progress" style={{ width: `${progress}%` }}></div>
                    <input
                        type="range"
                        className="progress-input"
                        value={progress}
                        max="100"
                        onChange={handleProgressChange}
                    />
                </div>
                <div className="time-display current-time">{formatTime(pausedAt)}</div>
                <div className="time-display total-time">{formatTime(duration)}</div>
            </div>
        </div>
    );
}

export default CustomAudioPlayer;
