import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Briefcase, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Trash2, 
  Eye, 
  Move, 
  Lock, 
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';

export default function ClientDirectory_4() {
  // Wizard Steps: 'photo_step' | 'details_step' | 'success_step'
  const [currentStep, setCurrentStep] = useState('photo_step');

  // Photo & Privacy Mask States
  const [originalPhoto, setOriginalPhoto] = useState(null);
  const [unmaskedPhoto, setUnmaskedPhoto] = useState(null);
  const [maskedPhoto, setMaskedPhoto] = useState(null);
  const [stickerType, setStickerType] = useState('emoji'); // 'emoji' | 'logo'
  const [selectedEmoji, setSelectedEmoji] = useState('🕶️');
  const [customLogo, setCustomLogo] = useState(null);
  
  // Draggable Sticker Interaction States
  const [stickerPos, setStickerPos] = useState({ x: 120, y: 120 });
  const [stickerSize, setStickerSize] = useState(80);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Client Details Form State
  const [formData, setFormData] = useState({
    fullName: '',
    title: '',
    department: '',
    location: '',
    email: '',
    phone: '',
    bio: '',
    clearanceLevel: 'Standard'
  });

  const [errors, setErrors] = useState({});
  const containerRef = useRef(null);

  // Handle image upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target.result;
        setOriginalPhoto(result);
        setUnmaskedPhoto(result);
        setMaskedPhoto(null);
        // Reset sticker to center of preview box
        setStickerPos({ x: 100, y: 100 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Logo upload for sticker
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomLogo(event.target.result);
        setStickerType('logo');
      };
      reader.readAsDataURL(file);
    }
  };

  // Mouse Drag Handlers for Sticker
  const handleStickerMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const rect = containerRef.current.getBoundingClientRect();
    setDragOffset({
      x: (e.clientX - rect.left) - stickerPos.x,
      y: (e.clientY - rect.top) - stickerPos.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    let newX = (e.clientX - rect.left) - dragOffset.x;
    let newY = (e.clientY - rect.top) - dragOffset.y;

    // Optional boundary clamping inside container
    const maxX = rect.width - stickerSize;
    const maxY = rect.height - stickerSize;

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    setStickerPos({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, stickerSize]);

  // Flatten Sticker to Canvas (Bake Privacy Mask)
  const flattenStickerToImage = () => {
    return new Promise((resolve) => {
      if (!originalPhoto || !containerRef.current) {
        resolve(originalPhoto);
        return;
      }

      const containerBox = containerRef.current.getBoundingClientRect();
      const baseImage = new Image();
      baseImage.crossOrigin = 'anonymous';
      baseImage.src = originalPhoto;

      baseImage.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Match actual natural dimensions of the uploaded photo
        canvas.width = baseImage.naturalWidth;
        canvas.height = baseImage.naturalHeight;

        // Draw base photo
        ctx.drawImage(baseImage, 0, 0);

        // Compute scaling factors between UI container and high-res image
        const scaleX = baseImage.naturalWidth / containerBox.width;
        const scaleY = baseImage.naturalHeight / containerBox.height;

        const renderX = stickerPos.x * scaleX;
        const renderY = stickerPos.y * scaleY;
        const renderSize = stickerSize * Math.max(scaleX, scaleY);

        if (stickerType === 'emoji') {
          ctx.font = `${renderSize}px sans-serif`;
          ctx.textBaseline = 'top';
          ctx.fillText(selectedEmoji, renderX, renderY);
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } else if (stickerType === 'logo' && customLogo) {
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          logoImg.src = customLogo;
          logoImg.onload = () => {
            ctx.drawImage(logoImg, renderX, renderY, renderSize, renderSize);
            resolve(canvas.toDataURL('image/jpeg', 0.92));
          };
          logoImg.onerror = () => resolve(originalPhoto);
        } else {
          resolve(originalPhoto);
        }
      };

      baseImage.onerror = () => resolve(originalPhoto);
    });
  };

  // Proceed to Step 2
  const handleProceedToDetails = async () => {
    const finalMasked = await flattenStickerToImage();
    setMaskedPhoto(finalMasked);
    setCurrentStep('details_step');
  };

  // Form Field Updates
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate Step 2 Form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.title.trim()) newErrors.title = 'Job title is required';
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setCurrentStep('success_step');
    }
  };

  const resetDirectoryForm = () => {
    setCurrentStep('photo_step');
    setOriginalPhoto(null);
    setUnmaskedPhoto(null);
    setMaskedPhoto(null);
    setCustomLogo(null);
    setFormData({
      fullName: '',
      title: '',
      department: '',
      location: '',
      email: '',
      phone: '',
      bio: '',
      clearanceLevel: 'Standard'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800">
      
      {/* Header Wizard Progress */}
      <div className="mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Secure Client Directory Portal</h1>
              <p className="text-sm text-slate-400">Add verified personnel records with built-in privacy masking.</p>
            </div>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 bg-slate-800 rounded-full text-indigo-300 border border-slate-700">
            {currentStep === 'photo_step' && 'Step 1: Photo & Privacy Mask'}
            {currentStep === 'details_step' && 'Step 2: Profile Metadata'}
            {currentStep === 'success_step' && 'Step 3: Verification Complete'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-500 h-full transition-all duration-500 ease-out"
            style={{ 
              width: currentStep === 'photo_step' ? '33%' : currentStep === 'details_step' ? '66%' : '100%' 
            }}
          />
        </div>
      </div>

      {/* STEP 1: PHOTO & PRIVACY MASK */}
      {currentStep === 'photo_step' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Left: Upload & Controls */}
            <div className="space-y-6">
              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/60 shadow-inner">
                <label className="block text-sm font-medium text-slate-300 mb-2">Upload Source Photograph</label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-xl cursor-pointer bg-slate-800/80 hover:bg-slate-800 hover:border-indigo-500 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                      <Upload className="w-8 h-8 mb-2 text-indigo-400" />
                      <p className="text-sm text-slate-300 font-medium">Click to upload photo</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG or WEBP (Max 10MB)</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>

              {originalPhoto && (
                <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/60 space-y-4">
                  <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Privacy Mask Configuration
                  </h3>
                  
                  {/* Sticker Type Toggle */}
                  <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setStickerType('emoji')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${stickerType === 'emoji' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Emoji Mask
                    </button>
                    <button
                      type="button"
                      onClick={() => setStickerType('logo')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${stickerType === 'logo' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Custom Logo
                    </button>
                  </div>

                  {stickerType === 'emoji' ? (
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Select Mask Emoji</label>
                      <div className="flex gap-2">
                        {['🕶️', '🐱', '🦊', '⭐', '🔒', '👻'].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setSelectedEmoji(emoji)}
                            className={`p-2 text-xl rounded-lg border transition-all ${selectedEmoji === emoji ? 'bg-indigo-600/30 border-indigo-500 scale-105' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs text-slate-400 mb-2">Upload Mask Logo / Watermark</label>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer" />
                    </div>
                  )}

                  {/* Size slider */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Mask Scale</span>
                      <span>{stickerSize}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="40" 
                      max="180" 
                      value={stickerSize} 
                      onChange={(e) => setStickerSize(Number(e.target.value))}
                      className="w-full accent-indigo-500 bg-slate-900 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right: Interactive Preview Area */}
            <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/60 flex flex-col items-center justify-center min-h-[360px]">
              {originalPhoto ? (
                <div className="space-y-3 w-full flex flex-col items-center">
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-indigo-400" /> Drag mask over sensitive regions (e.g. eyes)
                  </p>
                  
                  {/* Container for photo + movable sticker */}
                  <div 
                    id="photo-container"
                    ref={containerRef}
                    className="relative inline-block overflow-hidden rounded-xl border border-slate-700 shadow-lg select-none max-w-full"
                    style={{ maxHeight: '350px' }}
                  >
                    <img 
                      src={originalPhoto} 
                      alt="Source Preview" 
                      className="block max-h-[350px] w-auto object-contain pointer-events-none" 
                    />
                    
                    {/* Draggable Sticker Element */}
                    <div
                      id="privacy-sticker"
                      onMouseDown={handleStickerMouseDown}
                      className="absolute cursor-move flex items-center justify-center transition-shadow hover:ring-2 hover:ring-indigo-400 rounded-lg"
                      style={{
                        left: `${stickerPos.x}px`,
                        top: `${stickerPos.y}px`,
                        width: `${stickerSize}px`,
                        height: `${stickerSize}px`,
                        fontSize: `${stickerSize * 0.75}px`
                      }}
                    >
                      {stickerType === 'emoji' ? (
                        <span className="drop-shadow-md">{selectedEmoji}</span>
                      ) : customLogo ? (
                        <img src={customLogo} alt="Logo Mask" className="w-full h-full object-contain drop-shadow-md" />
                      ) : (
                        <span className="drop-shadow-md">🕶️</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3 text-slate-500">
                  <Camera className="w-12 h-12 mx-auto opacity-40" />
                  <p className="text-sm">Upload a photograph to activate privacy masking studio.</p>
                </div>
              )}
            </div>

          </div>

          {/* Step 1 Footer Action */}
          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="button"
              disabled={!originalPhoto}
              onClick={handleProceedToDetails}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg ${originalPhoto ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}`}
            >
              Next: Profile Details <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PROFILE DETAILS */}
      {currentStep === 'details_step' && (
        <form onSubmit={handleFormSubmit} className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Thumbnail Preview Card */}
            <div className="md:col-span-1 bg-slate-800/50 p-5 rounded-xl border border-slate-700/60 flex flex-col items-center text-center space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Masked Photo Preview</h3>
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-indigo-500/50 shadow-md bg-slate-900">
                {maskedPhoto && <img src={maskedPhoto} alt="Masked profile" className="w-full h-full object-cover" />}
              </div>
              <p className="text-xs text-slate-400">This masked version will be published publicly on the client directory card.</p>
              
              <button
                type="button"
                onClick={() => setCurrentStep('photo_step')}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                Adjust Mask Positioning
              </button>
            </div>

            {/* Form Fields */}
            <div className="md:col-span-2 space-y-4 bg-slate-800/30 p-6 rounded-xl border border-slate-700/60">
              <h3 className="text-sm font-semibold text-indigo-300 mb-2">Personnel Metadata</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                  <input 
                    type="text" 
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Alex Morgan" 
                    className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 ${errors.fullName ? 'border-rose-500' : 'border-slate-700'}`}
                  />
                  {errors.fullName && <p className="text-xs text-rose-400 mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Job Title *</label>
                  <input 
                    type="text" 
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Senior Security Analyst" 
                    className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 ${errors.title ? 'border-rose-500' : 'border-slate-700'}`}
                  />
                  {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                  <input 
                    type="text" 
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="e.g. Cyber Threat Intelligence" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Location / Office</label>
                  <input 
                    type="text" 
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g. Geneva, Switzerland" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Secure Email *</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. a.morgan@secure-net.org" 
                    className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 ${errors.email ? 'border-rose-500' : 'border-slate-700'}`}
                  />
                  {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Contact</label>
                  <input 
                    type="text" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="e.g. +41 22 555 0192" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Professional Bio / Summary</label>
                <textarea 
                  name="bio"
                  rows="3"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Brief overview of background and responsibilities..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

          </div>

          {/* Step 2 Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep('photo_step')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Photo
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg cursor-pointer"
            >
              Complete Registration <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: SUCCESS & COMPLETED RECORD */}
      {currentStep === 'success_step' && (
        <div className="space-y-6 text-center py-6 animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Client Record Verified Successfully</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              The privacy mask has been securely baked into the client file, and metadata has been stored in the directory ledger.
            </p>
          </div>

          {/* Preview Card Result */}
          <div className="max-w-sm mx-auto bg-slate-800/60 rounded-2xl border border-slate-700 overflow-hidden shadow-xl text-left">
            <div className="h-28 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 relative">
              <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-full border-4 border-slate-800 overflow-hidden bg-slate-900 shadow-md">
                {maskedPhoto && <img src={maskedPhoto} alt="Avatar" className="w-full h-full object-cover" />}
              </div>
            </div>
            
            <div className="pt-12 p-6 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">{formData.fullName}</h3>
                <p className="text-xs text-indigo-400 font-medium">{formData.title}</p>
                {formData.department && <p className="text-xs text-slate-400">{formData.department}</p>}
              </div>

              <div className="space-y-2 text-xs text-slate-300 border-t border-slate-700 pt-3">
                {formData.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formData.location}</span>
                  </div>
                )}
                {formData.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formData.email}</span>
                  </div>
                )}
                {formData.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formData.phone}</span>
                  </div>
                )}
              </div>

              {formData.bio && (
                <p className="text-xs text-slate-400 italic bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  "{formData.bio}"
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-center gap-4">
            <button
              type="button"
              onClick={resetDirectoryForm}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium text-sm transition-all shadow-lg cursor-pointer"
            >
              Add Another Client Record
            </button>
          </div>
        </div>
      )}

    </div>
  );
}