// Registration.tsx
import React, { useState, useRef, useEffect } from 'react';
import { PersonType, RegisteredUser } from '../types';
import { Camera, User, UserCheck, ArrowLeft, Plus, Trash2, Shield, BookOpen, GraduationCap, UserPlus, AlertCircle, CheckCircle2, RefreshCw, Loader2, Mail } from 'lucide-react';
import { Button } from './Button';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

interface RegistrationProps {
  onBack: () => void;
  onRegister: (user: RegisteredUser) => void;
  registeredUsers: RegisteredUser[];
}

export const Registration: React.FC<RegistrationProps> = ({ onBack, onRegister, registeredUsers }) => {
  const [step, setStep] = useState<'SELECT' | 'FORM'>('SELECT');
  const [selectedType, setSelectedType] = useState<PersonType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    rollNo: '',
    subject: '',
    age: '',
    branch: '',
    email: ''
  });
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera Setup
  const startCamera = async () => {
    try {
      setCameraError(false);
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraActive(true);
          setError(null);
        };
      }
    } catch (err: any) {
      console.error('Camera access denied:', err);
      setCameraError(true);
      setIsCameraActive(false);
      setError('Camera access denied. Please check permissions and reload.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (step === 'FORM' && !capturedImage) {
      startCamera();
    }
    return () => stopCamera();
  }, [step, capturedImage]);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready. Please wait.');
      return;
    }

    if (!isCameraActive) {
      setError('Camera is starting. Please wait a moment...');
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      setError('Canvas context not available');
      return;
    }

    const w = videoRef.current.videoWidth;
    const h = videoRef.current.videoHeight;

    if (w === 0 || h === 0) {
      setError('Camera not ready. Please wait a moment and try again.');
      return;
    }

    canvasRef.current.width = w;
    canvasRef.current.height = h;
    ctx.drawImage(videoRef.current, 0, 0, w, h);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    setError(null);
    stopCamera();
  };

  const handleTypeSelect = (type: PersonType) => {
    setSelectedType(type);
    setFormData({ name: '', rollNo: '', subject: '', age: '', branch: '', email: '' });
    setCapturedImage(null);
    setError(null);
    setCameraError(false);
    setStep('FORM');
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name) {
      setError('Please enter a name.');
      return;
    }
    if (!capturedImage) {
      setError('Please capture a face photo.');
      return;
    }

    if (selectedType === PersonType.STUDENT) {
      if (!formData.rollNo) {
        setError('Roll number is required for students.');
        return;
      }
      if (!formData.email) {
        setError('Email address is required for students.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    if (selectedType === PersonType.TEACHER && !formData.subject) {
      setError('Subject is required for teachers.');
      return;
    }

    setIsRegistering(true);

    try {
      // Prepare user data for API
      const userData: any = {
        type: selectedType,
        name: formData.name,
        photo: capturedImage,
      };

      if (selectedType === PersonType.STUDENT) {
        userData.rollNo = formData.rollNo;
        userData.branch = formData.branch || '';
        userData.age = formData.age ? parseInt(formData.age) : undefined;
        userData.email = formData.email;
      } else if (selectedType === PersonType.TEACHER) {
        userData.subject = formData.subject;
      }

      // Register via API
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Create local user object
        const newUser: RegisteredUser = {
          id: result.userId,
          name: formData.name,
          type: selectedType!,
          photo: capturedImage,
          faceDescriptor: null, // Backend handles face descriptor
          rollNo: formData.rollNo || undefined,
          subject: formData.subject || undefined,
          age: formData.age ? parseInt(formData.age) : undefined,
          branch: formData.branch || undefined,
          email: formData.email || undefined,
          registrationDate: new Date().toISOString()
        };

        onRegister(newUser);
        setSuccess(true);

        setTimeout(() => {
          setSuccess(false);
          setFormData({ name: '', rollNo: '', subject: '', age: '', branch: '', email: '' });
          setCapturedImage(null);
          setStep('SELECT');
          setIsRegistering(false);
        }, 2000);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
        setIsRegistering(false);
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Failed to register. Please make sure the backend server is running on port 5000.');
      setIsRegistering(false);
    }
  };

  const renderSelect = () => (
    <div className="grid grid-cols-3 gap-8 animate-fadeIn">
      <div
        onClick={() => handleTypeSelect(PersonType.TEACHER)}
        className="group bg-gray-800/50 border-2 border-gray-700 p-10 rounded-3xl flex flex-col items-center cursor-pointer hover:border-hud-cyan hover:bg-hud-cyan/5 transition-all duration-300"
      >
        <div className="w-24 h-24 bg-gray-700 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-hud-cyan group-hover:text-black transition-colors">
          <BookOpen size={48} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">TEACHER</h3>
        <p className="text-gray-400 text-center text-sm">Register as a faculty member to manage classes.</p>
      </div>

      <div
        onClick={() => handleTypeSelect(PersonType.STUDENT)}
        className="group bg-gray-800/50 border-2 border-gray-700 p-10 rounded-3xl flex flex-col items-center cursor-pointer hover:border-hud-green hover:bg-hud-green/5 transition-all duration-300"
      >
        <div className="w-24 h-24 bg-gray-700 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-hud-green group-hover:text-black transition-colors">
          <GraduationCap size={48} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">STUDENT</h3>
        <p className="text-gray-400 text-center text-sm">Register as a student for attendance tracking.</p>
      </div>

      <div
        onClick={() => handleTypeSelect(PersonType.GUEST)}
        className="group bg-gray-800/50 border-2 border-gray-700 p-10 rounded-3xl flex flex-col items-center cursor-pointer hover:border-hud-yellow hover:bg-hud-yellow/5 transition-all duration-300"
      >
        <div className="w-24 h-24 bg-gray-700 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-hud-yellow group-hover:text-black transition-colors">
          <User size={48} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">GUEST</h3>
        <p className="text-gray-400 text-center text-sm">Register as a temporary visitor or guest.</p>
      </div>
    </div>
  );

  const renderForm = () => (
    <div className="bg-gray-800/50 border border-gray-700 rounded-3xl p-8 max-w-4xl w-full mx-auto animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <UserPlus className="text-hud-cyan" /> REGISTER NEW {selectedType?.toUpperCase()}
        </h2>
        <Button variant="secondary" onClick={() => { setStep('SELECT'); stopCamera(); }} icon={<ArrowLeft size={18} />}>BACK</Button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-10">
        {/* Left: Camera/Photo */}
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-mono text-gray-400 uppercase mb-2">
              Face Photo {capturedImage && '✓'}
            </label>
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border-2 border-gray-700">
              {!capturedImage && (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none">
                    <div className="w-full h-full border-2 border-hud-cyan/50 border-dashed"></div>
                  </div>
                  {!isCameraActive && !cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="flex flex-col items-center">
                        <Loader2 size={40} className="animate-spin text-hud-cyan mb-2" />
                        <p className="text-white text-sm">Starting camera...</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <button
                      type="button"
                      onClick={captureImage}
                      disabled={!isCameraActive}
                      className={`px-5 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2 font-mono font-bold text-sm ${isCameraActive
                        ? 'bg-hud-cyan text-black cursor-pointer'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                      {!isCameraActive ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          STARTING CAMERA...
                        </>
                      ) : (
                        <>
                          <Camera size={20} />
                          CAPTURE FACE
                        </>
                      )}
                    </button>
                  </div>
                  {cameraError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                      <AlertCircle size={40} className="text-red-500 mb-2" />
                      <p className="text-red-400 text-sm text-center px-4">Camera access denied. Please check permissions.</p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="mt-4 px-4 py-2 bg-hud-cyan text-black rounded-lg text-sm font-mono"
                      >
                        RETRY
                      </button>
                    </div>
                  )}
                </>
              )}
              {capturedImage && (
                <div className="relative w-full h-full">
                  <img src={capturedImage} alt="Captured Face" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-green-500/90 text-white text-xs font-bold px-2 py-1.5 text-center">
                    ✓ FACE PHOTO CAPTURED
                  </div>
                  <button
                    type="button"
                    onClick={handleRetakePhoto}
                    className="absolute top-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono flex items-center gap-1 hover:bg-red-500 transition-colors"
                  >
                    <RefreshCw size={12} /> RETAKE
                  </button>
                </div>
              )}
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="text-xs text-gray-500 italic">
            * Camera starts automatically. Ensure clear lighting and face visibility for optimal AI recognition.
          </div>
        </div>

        {/* Right: Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-hud-cyan outline-none transition-colors"
              placeholder="Enter full name"
            />
          </div>

          {selectedType === PersonType.STUDENT && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.rollNo}
                    onChange={e => setFormData({ ...formData, rollNo: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-hud-cyan outline-none transition-colors"
                    placeholder="e.g. 2024CS01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-hud-cyan outline-none transition-colors"
                    placeholder="Years"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-10 py-3 text-white focus:border-hud-cyan outline-none transition-colors"
                    placeholder="student@example.com"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Used for attendance notifications</p>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Branch / Department</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={e => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-hud-cyan outline-none transition-colors"
                  placeholder="e.g. Computer Science"
                />
              </div>
            </>
          )}

          {selectedType === PersonType.TEACHER && (
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase mb-1">Primary Subject *</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-hud-cyan outline-none transition-colors"
                placeholder="e.g. Mathematics"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-3 text-red-500 text-sm animate-bounce-in">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg flex items-center gap-3 text-green-500 text-sm animate-bounce-in">
              <CheckCircle2 size={18} /> Registration Successful!
            </div>
          )}

          <div className="pt-6 flex gap-4">
            <Button
              type="submit"
              className="flex-1"
              variant="primary"
              icon={isRegistering ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
              disabled={success || isRegistering || !capturedImage}
            >
              {isRegistering ? 'REGISTERING...' : 'COMPLETE REGISTRATION'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-hud-black p-12 flex flex-col">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tighter mb-2">USER REGISTRATION</h1>
          <p className="text-gray-500 font-mono text-sm">SECURE DATABASE ENTRY SYSTEM // VER 2.1</p>
        </div>
        <Button variant="secondary" onClick={onBack} icon={<ArrowLeft size={18} />}>BACK TO HOME</Button>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {step === 'SELECT' ? renderSelect() : renderForm()}
      </div>

      {/* Footer Stats */}
      <div className="mt-12 flex justify-center gap-12 text-xs font-mono text-gray-600">
        <div className="flex items-center gap-2">
          <Shield size={14} /> ENCRYPTED STORAGE ACTIVE
        </div>
        <div className="flex items-center gap-2">
          <UserCheck size={14} /> {registeredUsers.length} USERS REGISTERED
        </div>
      </div>
    </div>
  );
};