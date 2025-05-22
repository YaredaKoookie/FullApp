import Loading from '@/components/Loading';
import apiClient from '@api/apiClient';
import { useQuery } from '@tanstack/react-query';
import AgoraRTC from 'agora-rtc-sdk-ng';
import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, User, Maximize2, Minimize2, Settings, Share2, Monitor, Camera } from 'lucide-react';

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID;

const client = new AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

const getToken = async (channel) => {
    const response = await apiClient.get(`/video/token`, { params: { channel } });
    return response.data;
}

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const VideoCall = () => {
    const { appointmentId: channel } = useParams();
    const navigate = useNavigate();
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const screenShareRef = useRef(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [isRemoteUserJoined, setIsRemoteUserJoined] = useState(false);
    const [localTrack, setLocalTrack] = useState(null);
    const [screenTrack, setScreenTrack] = useState(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isLocalVideoExpanded, setIsLocalVideoExpanded] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [activeView, setActiveView] = useState('camera');

    const { data, isLoading } = useQuery({
        queryKey: ["video-token", channel],
        queryFn: () => getToken(channel)
    });

    useEffect(() => {
        let timer;
        if (isRemoteUserJoined) {
            timer = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isRemoteUserJoined]);

    useEffect(() => {
        if (!data) return;

        async function joinChannel() {
            try {
                await client.join(AGORA_APP_ID, channel, data.token, data.uid);
                const track = await AgoraRTC.createCameraVideoTrack();
                setLocalTrack(track);
                track.play(localVideoRef.current);
                await client.publish([track]);

                client.on("user-published", async (user, mediaType) => {
                    await client.subscribe(user, mediaType);
                    if(mediaType === "video"){
                        const remoteTrack = user.videoTrack;
                        remoteTrack.play(remoteVideoRef.current);
                        setIsRemoteUserJoined(true);
                    }
                });

                client.on("user-unpublished", () => {
                    setIsRemoteUserJoined(false);
                });
            } catch (error) {
                console.error("Error joining channel:", error);
            }
        }

        joinChannel();

        return () => {
            if (localTrack) {
                localTrack.close();
            }
            if (screenTrack) {
                screenTrack.close();
            }
            client.leave();
        };
    }, [data, channel]);

    const toggleMic = async () => {
        if (localTrack) {
            await localTrack.setEnabled(!isMicOn);
            setIsMicOn(!isMicOn);
        }
    };

    const toggleCamera = async () => {
        if (localTrack) {
            await localTrack.setEnabled(!isCameraOn);
            setIsCameraOn(!isCameraOn);
        }
    };

    const toggleScreenShare = async () => {
        try {
            if (isScreenSharing) {
                // Stop screen sharing
                if (screenTrack) {
                    await client.unpublish([screenTrack]);
                    screenTrack.close();
                    setScreenTrack(null);
                }
                setIsScreenSharing(false);
                setActiveView('camera');
            } else {
                // Start screen sharing
                const track = await AgoraRTC.createScreenVideoTrack({
                    encoderConfig: {
                        width: 1920,
                        height: 1080,
                        frameRate: 15,
                        bitrateMin: 1000,
                        bitrateMax: 3000,
                    },
                });
                setScreenTrack(track);
                track.play(screenShareRef.current);
                await client.publish([track]);
                setIsScreenSharing(true);
                setActiveView('screen');

                // Handle screen sharing stop
                track.on("ended", async () => {
                    await client.unpublish([track]);
                    track.close();
                    setScreenTrack(null);
                    setIsScreenSharing(false);
                    setActiveView('camera');
                });
            }
        } catch (error) {
            console.error("Error toggling screen share:", error);
        }
    };

    const switchView = () => {
        if (isScreenSharing) {
            setActiveView(activeView === 'camera' ? 'screen' : 'camera');
        }
    };

    const endCall = async () => {
        setIsLeaving(true);
        if (localTrack) {
            localTrack.close();
        }
        if (screenTrack) {
            screenTrack.close();
        }
        await client.leave();
        navigate('/');
    };

    if (!channel) {
        return <Navigate to="/" />;
    }

    if (isLoading) {
        return <Loading />;
    }

    if (!data?.token) {
        return <Navigate to="/" />;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center">
                    <div className="text-center mb-4">
                        <h1 className="text-2xl font-bold mb-2">Video Consultation</h1>
                        {isRemoteUserJoined && (
                            <div className="flex items-center justify-center gap-2">
                                <p className="text-gray-400">Call Duration: {formatTime(callDuration)}</p>
                                <div className="flex items-center gap-2">
                                    {!isMicOn && (
                                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-sm flex items-center gap-1">
                                            <MicOff size={14} /> Muted
                                        </span>
                                    )}
                                    {!isCameraOn && (
                                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-sm flex items-center gap-1">
                                            <VideoOff size={14} /> Camera Off
                                        </span>
                                    )}
                                    {isScreenSharing && (
                                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm flex items-center gap-1">
                                            <Share2 size={14} /> Screen Sharing
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative w-full max-w-6xl aspect-video bg-gray-800 rounded-lg overflow-hidden mb-4">
                        <div className="absolute inset-0">
                            {activeView === 'camera' ? (
                                <div ref={remoteVideoRef} className="w-full h-full"></div>
                            ) : (
                                <div ref={screenShareRef} className="w-full h-full bg-black"></div>
                            )}
                            {!isRemoteUserJoined && activeView === 'camera' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                                    <div className="text-center">
                                        <User className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                                        <p className="text-gray-400">Waiting for doctor to join...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div 
                            className={`absolute transition-all duration-300 ease-in-out ${
                                isLocalVideoExpanded 
                                    ? 'bottom-4 right-4 w-64 h-48' 
                                    : 'bottom-4 right-4 w-48 h-36'
                            } bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700`}
                        >
                            {activeView === 'camera' ? (
                                <div ref={localVideoRef} className="w-full h-full"></div>
                            ) : (
                                <div ref={remoteVideoRef} className="w-full h-full"></div>
                            )}
                            <button
                                onClick={() => setIsLocalVideoExpanded(!isLocalVideoExpanded)}
                                className="absolute top-2 right-2 p-1 bg-gray-800/50 rounded-full hover:bg-gray-700/50 transition-colors"
                            >
                                {isLocalVideoExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                        </div>

                        {isScreenSharing && (
                            <button
                                onClick={switchView}
                                className="absolute top-4 right-4 p-2 bg-gray-800/50 rounded-full hover:bg-gray-700/50 transition-colors flex items-center gap-2"
                                title={activeView === 'camera' ? "Show Screen Share" : "Show Camera"}
                            >
                                {activeView === 'camera' ? (
                                    <>
                                        <Monitor size={16} />
                                        <span className="text-sm">Show Screen</span>
                                    </>
                                ) : (
                                    <>
                                        <Camera size={16} />
                                        <span className="text-sm">Show Camera</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={toggleMic}
                            className={`p-4 rounded-full transition-colors ${
                                isMicOn 
                                    ? 'bg-blue-600 hover:bg-blue-700' 
                                    : 'bg-red-600 hover:bg-red-700'
                            }`}
                            title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
                        >
                            {isMicOn ? <Mic /> : <MicOff />}
                        </button>
                        <button
                            onClick={toggleCamera}
                            className={`p-4 rounded-full transition-colors ${
                                isCameraOn 
                                    ? 'bg-blue-600 hover:bg-blue-700' 
                                    : 'bg-red-600 hover:bg-red-700'
                            }`}
                            title={isCameraOn ? "Turn Off Camera" : "Turn On Camera"}
                        >
                            {isCameraOn ? <Video /> : <VideoOff />}
                        </button>
                        <button
                            onClick={toggleScreenShare}
                            className={`p-4 rounded-full transition-colors ${
                                isScreenSharing 
                                    ? 'bg-blue-600 hover:bg-blue-700' 
                                    : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                            title={isScreenSharing ? "Stop Screen Sharing" : "Start Screen Sharing"}
                        >
                            <Share2 />
                        </button>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                            title="Settings"
                        >
                            <Settings />
                        </button>
                        <button
                            onClick={endCall}
                            disabled={isLeaving}
                            className="p-4 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                            title="End Call"
                        >
                            <PhoneOff />
                        </button>
                    </div>

                    {showSettings && (
                        <div className="mt-4 p-4 bg-gray-800 rounded-lg w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-2">Call Settings</h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span>Microphone</span>
                                    <button
                                        onClick={toggleMic}
                                        className={`px-3 py-1 rounded ${
                                            isMicOn ? 'bg-green-600' : 'bg-red-600'
                                        }`}
                                    >
                                        {isMicOn ? 'On' : 'Off'}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Camera</span>
                                    <button
                                        onClick={toggleCamera}
                                        className={`px-3 py-1 rounded ${
                                            isCameraOn ? 'bg-green-600' : 'bg-red-600'
                                        }`}
                                    >
                                        {isCameraOn ? 'On' : 'Off'}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Screen Sharing</span>
                                    <button
                                        onClick={toggleScreenShare}
                                        className={`px-3 py-1 rounded ${
                                            isScreenSharing ? 'bg-green-600' : 'bg-gray-600'
                                        }`}
                                    >
                                        {isScreenSharing ? 'On' : 'Off'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VideoCall;