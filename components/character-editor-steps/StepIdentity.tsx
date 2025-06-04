import React, { useState, useRef, useEffect } from 'react';
import { useCharacterWizard, CharacterFormData } from '../../src/contexts/CharacterWizardContext'; // Updated import
import StepTemplate from '../../src/components/StepTemplate'; // Import StepTemplate
import { EscalaPersonagem } from '../../types'; // Assuming types are defined here
// Alteração: Usar a URL completa para a importação
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'https://esm.sh/react-image-crop@11.0.5';

// Removed Props interface as we use context now

const inputClass = "w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-100 placeholder-slate-400";
const labelClass = "block text-sm font-medium text-slate-300 mb-1";
const buttonClass = "px-4 py-2 rounded-md text-sm font-medium transition-colors bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-50";
const secondaryButtonClass = "px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-slate-600 hover:bg-slate-500 text-slate-200";

const escalaOptions: EscalaPersonagem[] = ["Ningen", "Sugoi", "Kiodai", "Kami"];
const escalaDescriptions: Record<EscalaPersonagem, string> = {
  Ningen: "Ningen é a escala padrão para personagens jogadores...",
  Sugoi: "Sugoi é para seres com capacidades extraordinárias...",
  Kiodai: "Kiodai é a escala para seres imensos...",
  Kami: "Kami, por fim, representa seres quase onipotentes..."
};

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

async function getCroppedImg(image: HTMLImageElement, crop: PixelCrop, fileName: string): Promise<string | null> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  
  const MAX_WIDTH = 800;
  const MAX_HEIGHT = 800;

  let targetWidth = crop.width;
  let targetHeight = crop.height;

  if (targetWidth > MAX_WIDTH || targetHeight > MAX_HEIGHT) {
    const ratio = Math.min(MAX_WIDTH / targetWidth, MAX_HEIGHT / targetHeight);
    targetWidth *= ratio;
    targetHeight *= ratio;
  }
  
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    targetWidth,
    targetHeight
  );
  
  return new Promise((resolve) => {
    resolve(canvas.toDataURL('image/jpeg', 0.9));
  });
}

// Added props for navigation functions from the parent wizard component
interface StepIdentityProps {
    onNext?: () => void;
    onPrevious?: () => void; // Although likely the first step, keep for consistency
    isFirstStep?: boolean;
}

const StepIdentity: React.FC<StepIdentityProps> = ({ onNext, onPrevious, isFirstStep = true }) => {
  const { state, dispatch } = useCharacterWizard(); // Use context
  const formData = state; // Use state from context

  // Helper to dispatch updates
  const updateFormData = (data: Partial<CharacterFormData>) => {
    // We need specific actions for nested fields like attributes
    // For simple fields, we can use SET_FIELD
    Object.entries(data).forEach(([key, value]) => {
        // Example: Handle nested attributes separately if needed, otherwise use SET_FIELD
        // if (key === 'attributes') { ... } else ...
        dispatch({ type: 'SET_FIELD', field: key as keyof CharacterFormData, value });
    });
  };

  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect] = useState<number>(1 / 1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [avatarMode, setAvatarMode] = useState<'upload' | 'url'>('url');
  const [urlInput, setUrlInput] = useState(formData.avatarUrl || '');

  useEffect(() => {
    const currentAvatar = formData.avatarUrl || '';
    if (currentAvatar.startsWith('http')) {
      setAvatarMode('url');
      setUrlInput(currentAvatar);
    } else if (currentAvatar) {
      setAvatarMode('upload'); // Assume base64, show preview
      setUrlInput(''); // Clear URL input if showing base64 preview
    } else {
        setAvatarMode('url'); // Default to URL if no avatar
        setUrlInput('');
    }
  }, [formData.avatarUrl]);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setIsCropping(true);
        setAvatarMode('upload');
        setUrlInput(''); // Clear URL input when uploading
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  };

  const handleApplyCrop = async () => {
    if (completedCrop && imgRef.current) {
      const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop, 'avatar.jpg');
      if (croppedImageUrl) {
        updateFormData({ avatarUrl: croppedImageUrl });
        setIsCropping(false);
        setImgSrc('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };
  
  const handleUseUrl = () => {
    if (urlInput.startsWith('http://') || urlInput.startsWith('https://')) {
        updateFormData({ avatarUrl: urlInput });
        setIsCropping(false);
        setImgSrc('');
    } else {
        alert("Por favor, insira uma URL válida (http:// ou https://).");
    }
  };

  const clearAvatar = () => {
    updateFormData({ avatarUrl: '' });
    setImgSrc('');
    setUrlInput('');
    setIsCropping(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setAvatarMode('url'); // Reset mode
  };

  // Basic validation: Check if required fields are filled
  const canProceed = !!formData.name && !!formData.conceito && !!formData.aparencia && !!formData.escala;

  return (
    <StepTemplate 
        title="Identidade do Personagem"
        onNext={onNext} 
        onPrevious={onPrevious} 
        canProceed={canProceed} 
        isFirstStep={isFirstStep}
    >
      <div className="space-y-6">
        <div>
          <label htmlFor="charName" className={labelClass}>Nome do Personagem <span className="text-red-400">*</span></label>
          <input type="text" id="charName" value={formData.name} onChange={(e) => updateFormData({ name: e.target.value })} className={inputClass} placeholder="Ex: Valerius, o Bravo" required />
        </div>
        <div>
          <label htmlFor="charConceito" className={labelClass}>Conceito (Resumo) <span className="text-red-400">*</span></label>
          <input type="text" id="charConceito" value={formData.conceito || ''} onChange={(e) => updateFormData({ conceito: e.target.value })} className={inputClass} placeholder="Ex: Guerreiro dimensional em busca de vingança" required />
        </div>
        <div>
          <label htmlFor="charAparencia" className={labelClass}>Descrição da Aparência <span className="text-red-400">*</span></label>
          <textarea id="charAparencia" rows={3} value={formData.aparencia || ''} onChange={(e) => updateFormData({ aparencia: e.target.value })} className={inputClass} placeholder="Descreva a aparência física, vestimentas, etc." required />
        </div>

        {/* Avatar Section - unchanged logic, just uses context now */}
        <div className="space-y-3 p-4 bg-slate-700/30 rounded-lg">
          <label className={labelClass}>Avatar do Personagem</label>
          <div className="flex space-x-2 mb-2">
            <button onClick={() => { setAvatarMode('upload'); setIsCropping(false); setUrlInput(formData.avatarUrl?.startsWith('http') ? '' : formData.avatarUrl || ''); }} className={`${secondaryButtonClass} ${avatarMode === 'upload' ? 'bg-sky-600 text-white' : ''}`}>Upload & Cortar</button>
            <button onClick={() => { setAvatarMode('url'); setIsCropping(false); setImgSrc(''); }} className={`${secondaryButtonClass} ${avatarMode === 'url' ? 'bg-sky-600 text-white' : ''}`}>Usar URL Externa</button>
          </div>
          {formData.avatarUrl && !isCropping && (
            <div className="my-2 flex flex-col items-center">
              <img src={formData.avatarUrl} alt="Avatar Preview" className="w-32 h-32 rounded-lg object-cover border-2 border-sky-500 mb-2"/>
              <button onClick={clearAvatar} className={`${secondaryButtonClass} text-xs`}>Remover Avatar</button>
            </div>
          )}
          {!formData.avatarUrl && !isCropping && <div className="w-32 h-32 rounded-lg bg-slate-600 flex items-center justify-center text-slate-400 text-sm my-2 mx-auto">Preview</div>}
          {avatarMode === 'upload' && (
            <div className="mt-2">
              <input type="file" accept="image/*" onChange={onSelectFile} ref={fileInputRef} className="text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-500 file:text-white hover:file:bg-sky-600 block w-full" />
              {isCropping && imgSrc && (
                <div className="mt-4 flex flex-col items-center">
                  <ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={aspect} minWidth={100} minHeight={100} className="max-w-full">
                    <img ref={imgRef} alt="Crop me" src={imgSrc} onLoad={onImageLoad} style={{ maxHeight: '400px' }} />
                  </ReactCrop>
                  <button onClick={handleApplyCrop} className={`${buttonClass} mt-4`} disabled={!completedCrop}>Aplicar Corte & Usar</button>
                  <button onClick={() => { setIsCropping(false); setImgSrc(''); if(fileInputRef.current) fileInputRef.current.value = ''; }} className={`${secondaryButtonClass} mt-2`}>Cancelar Corte</button>
                </div>
              )}
            </div>
          )}
          {avatarMode === 'url' && !isCropping && (
            <div className="mt-2">
              <label htmlFor="avatarUrlInput" className="text-xs text-slate-400 mb-1 block">URL da Imagem:</label>
              <div className="flex gap-2">
                <input type="text" id="avatarUrlInput" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className={`${inputClass} text-sm flex-grow`} placeholder="https://exemplo.com/imagem.png" />
                <button onClick={handleUseUrl} className={`${buttonClass} text-xs`} disabled={!urlInput}>Usar URL</button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Imagens de URL não podem ser cortadas/redimensionadas pelo app.</p>
            </div>
          )}
        </div>

        {/* Other fields - unchanged logic, just uses context now */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="charNivelPoder" className={labelClass}>Nível de Poder (Pontos de Personagem)</label>
            <input type="number" id="charNivelPoder" value={formData.nivelDePoder || 0} onChange={(e) => updateFormData({ nivelDePoder: parseInt(e.target.value, 10) || 0 })} className={inputClass} min="0" />
            <p className="text-xs text-slate-400 mt-1">Define o total de pontos para atributos, vantagens, etc. (Padrão: 10)</p>
          </div>
          <div>
            <label htmlFor="charXPInicial" className={labelClass}>XP Inicial</label>
            <input type="number" id="charXPInicial" value={formData.xpInicial || 0} readOnly className={`${inputClass} bg-slate-600 cursor-not-allowed`} />
            <p className="text-xs text-slate-400 mt-1">Personagens iniciam com 0 XP.</p>
          </div>
        </div>
        <div>
          <label htmlFor="charEscala" className={labelClass}>Escala <span className="text-red-400">*</span></label>
          <select id="charEscala" value={formData.escala || 'Ningen'} onChange={(e) => updateFormData({ escala: e.target.value as EscalaPersonagem })} className={inputClass} required >
            {escalaOptions.map(option => (<option key={option} value={option}>{option}</option>))}
          </select>
          <p className="text-xs text-slate-400 mt-1 whitespace-pre-line">{escalaDescriptions[formData.escala || 'Ningen'] || "Selecione uma escala para ver a descrição."}</p>
        </div>
        <div>
          <label htmlFor="charHistory" className={labelClass}>História/Objetivo (Opcional)</label>
          <textarea id="charHistory" rows={4} value={formData.history || ''} onChange={(e) => updateFormData({ history: e.target.value })} className={inputClass} placeholder="Descreva o passado, motivações e objetivos..." />
        </div>
        <div>
          <label htmlFor="charXP" className={labelClass}>Pontos de Experiência (XP)</label>
          <input type="number" id="charXP" value={formData.xp || 0} onChange={(e) => updateFormData({ xp: parseInt(e.target.value, 10) || 0 })} className={inputClass} min="0" />
          <p className="text-xs text-slate-400 mt-1">XP atual. Pode ser alterado aqui ou ganho em aventuras.</p>
        </div>
        <div>
          <label htmlFor="charNotes" className={labelClass}>Anotações Livres (Opcional)</label>
          <textarea id="charNotes" rows={5} value={formData.notes || ''} onChange={(e) => updateFormData({ notes: e.target.value })} className={inputClass} placeholder="Detalhes sobre aliados, inimigos, locais, etc..." />
        </div>
        <div>
          <label htmlFor="charDescription" className={labelClass}>Descrição Curta para Galeria (Opcional)</label>
          <textarea id="charDescription" rows={3} value={formData.description || ''} onChange={(e) => updateFormData({ description: e.target.value })} className={inputClass} placeholder="Uma breve descrição para a galeria de personagens..." />
        </div>
        <p className="text-xs text-slate-400"><span className="text-red-400">*</span> Campo obrigatório.</p>
      </div>
    </StepTemplate>
  );
};

export default StepIdentity;

