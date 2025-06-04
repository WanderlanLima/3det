
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CharacterFormData, SelectedCompendiumItem, SelectedEquipmentItem, CHARACTER_SHEET_PREFIX_KEY } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { ShieldCheck, Swords, Brain, HeartPulse, Zap, Star, Scroll, Sparkles, Gem, Archive, BookOpen, Users, Palette, HistoryIcon, StickyNote, Workflow, XCircle, Image as ImageIcon, Wand2 } from 'lucide-react';

// Section Title Component for Web View
const WebSectionTitle: React.FC<{ title: string; icon?: React.ReactNode }> = ({ title, icon }) => (
  <div className="flex items-center mt-6 mb-3 no-print">
    {icon && <span className="mr-2 text-sky-400">{icon}</span>}
    <h3 className="text-xl font-semibold text-sky-400">{title}</h3>
  </div>
);

// Attribute Display Component (for P/H/R + Derived) for Web View
const WebAttributeStatGroup: React.FC<{
  attributeName: string;
  attributeValue: number;
  derivedStatName: string;
  derivedStatValue: number;
  icon?: React.ReactNode;
  colorClass?: string;
}> = ({ attributeName, attributeValue, derivedStatName, derivedStatValue, icon, colorClass = "border-slate-600" }) => (
  <div className={`bg-slate-800/70 p-4 rounded-lg shadow-md no-print ${colorClass}`}>
    <div className="flex items-center mb-2">
        {icon && <span className="mr-2 text-sky-300">{icon}</span>}
        <h4 className="font-semibold text-slate-200">{attributeName}</h4>
    </div>
    <p className="text-2xl font-bold text-sky-300 ml-1">{attributeValue}</p>
    <p className="text-sm text-slate-400 ml-1 mt-1">{derivedStatName}: <span className="font-semibold text-sky-400">{derivedStatValue}</span></p>
  </div>
);

// Item Card Component (for V/D, Skills, Techniques, etc.) for Web View
interface WebItemCardProps {
  item: SelectedCompendiumItem | SelectedEquipmentItem;
  costText: string;
  colorClass?: string;
  isFromArchetype?: boolean;
  onClick?: () => void;
}

const WebItemCard: React.FC<WebItemCardProps> = ({ item, costText, colorClass = "bg-slate-700/80", isFromArchetype, onClick }) => {
    let titleColor = "text-sky-300";
    if (item.type === 'Técnica') {
        if (item.subtype === 'Truque') titleColor = "text-blue-400";
        else if (item.subtype === 'Comum') titleColor = "text-purple-400";
        else if (item.subtype === 'Lendária') titleColor = "text-amber-400";
    } else if (item.type === 'Vantagem') {
        titleColor = "text-green-400";
    } else if (item.type === 'Desvantagem') {
        titleColor = "text-red-400";
    } else if (item.type === 'Artefato' || item.subtype === 'Artefato') {
        titleColor = "text-emerald-400";
    } else if (item.type === 'Consumível' || item.subtype === 'Consumível') {
        titleColor = "text-pink-400";
    }


  return (
    <div 
        className={`p-3 rounded-md shadow-sm no-print ${colorClass} ${isFromArchetype ? 'border-l-4 border-sky-500' : ''} ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-sky-500' : ''}`}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
    >
      <h5 className={`font-semibold ${titleColor}`}>
        {item.name}
        {item.type === 'Vantagem' || item.type === 'Desvantagem' ? 
            ('currentLevel' in item && item.currentLevel ? ` (Nível ${item.currentLevel})` : '') 
            : (item.subtype ? ` (${item.subtype})` : '')
        }
        {('quantity' in item && item.quantity && item.quantity > 1 && (item.type === 'Consumível' || item.subtype === 'Consumível')) && ` (x${item.quantity})`}
      </h5>
      <p className="text-xs text-slate-300 mb-1">{costText}</p>
      <p className="text-xs text-slate-400 line-clamp-2">{item.description.split('\n')[0].split('•')[0]}</p>
      {isFromArchetype && <p className="text-xs text-sky-400 italic mt-1">(do Arquétipo)</p>}
    </div>
  );
};


const CharacterViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [character, setCharacter] = useState<CharacterFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalItem, setDetailModalItem] = useState<SelectedCompendiumItem | SelectedEquipmentItem | null>(null);

  const openDetailModal = (item: SelectedCompendiumItem | SelectedEquipmentItem) => {
    setDetailModalItem(item);
    setIsDetailModalOpen(true);
  };
  const closeDetailModal = () => setIsDetailModalOpen(false);


  useEffect(() => {
    if (!id) {
      setError("ID da ficha não fornecido.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const charDataString = localStorage.getItem(`${CHARACTER_SHEET_PREFIX_KEY}${id}`);
      if (charDataString) {
        const charData = JSON.parse(charDataString);
        setCharacter(charData);
      } else {
        setError("Ficha não encontrada.");
      }
    } catch (e) {
      console.error("Erro ao carregar ficha:", e);
      setError("Erro ao carregar dados da ficha.");
    }
    setLoading(false);
  }, [id]);

  const handlePrint = () => {
    window.print();
  };
  
  const getItemCostText = (item: SelectedCompendiumItem | SelectedEquipmentItem): string => {
    if (item.isFromArchetype && item.type !== 'Arquétipo') return ""; 
    
    if (item.type === 'Técnica' || item.type === 'Artefato' || item.subtype === 'Artefato') {
      return `(${item.cost || 0}XP)`;
    }
    if (item.type === 'Perícia' || item.type === 'Vantagem' || item.type === 'Desvantagem' || item.type === 'Arquétipo') {
      return `(${item.cost || 0}pts)`;
    }
    if (item.type === 'Consumível' || item.subtype === 'Consumível') {
      return "(Inventário)";
    }
    return "";
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-center text-xl text-red-400 py-10 no-print">{error}</p>;
  if (!character) return <p className="text-center text-xl text-slate-400 py-10 no-print">Nenhuma ficha para visualizar.</p>;

  const { attributes, skills, advantages, disadvantages, archetype, techniquesAndTricks, equipment } = character;
  
  // ... (Print-specific functions and styles - unchanged)
  const printNameField = (label: string, value: string) => (
    <div className="print:mb-1 print:flex print:items-end">
      <span className="print:font-bold print:text-xs print:uppercase print:mr-2">{label}:</span>
      <span className="print:border-b print:border-black print:flex-grow print:pb-px print:text-sm">{value || '____________________________'}</span>
    </div>
  );
  
  const printAttributeBox = (label: string, value: number, isBig: boolean = false) => (
    <div className={`print:border print:border-black print:text-center ${isBig ? 'print:p-1 print:w-12' : 'print:p-0.5 print:w-10'}`}>
      <div className={`print:bg-black print:text-white print:font-bold ${isBig ? 'print:text-sm print:py-0.5' : 'print:text-xs'}`}>{label}</div>
      <div className={`${isBig ? 'print:text-2xl' : 'print:text-lg'} print:font-bold`}>{String(value).padStart(2, '0')}</div>
    </div>
  );

  const printSection = (title: string, items: (SelectedCompendiumItem | SelectedEquipmentItem)[], showDescription: boolean = false) => (
    <div className="print:mb-2">
      <h4 className="print:font-bold print:text-sm print:uppercase print:border-b-2 print:border-black print:mb-1">{title}</h4>
      <div className="print:space-y-0.5">
        {items.length > 0 ? items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="print:border-b print:border-dotted print:border-gray-400 print:pb-px print:text-xs">
            <span className="print:font-semibold">{item.name}</span>
            {item.type === 'Vantagem' || item.type === 'Desvantagem' ? 
              ('currentLevel' in item && item.currentLevel ? ` (Nível ${item.currentLevel})` : '') 
              : (item.subtype ? ` (${item.subtype})` : '')
            }
            {/* Adjust cost display for print to handle XP vs PP properly if needed, or simplify */}
            <span className="print:ml-1 print:text-gray-600">
              {item.type === 'Técnica' || item.type === 'Artefato' || item.subtype === 'Artefato' ? `(${item.cost || 0}XP)` : `(${item.cost || 0}pts)`}
            </span>
            {item.isFromArchetype && <span className="print:text-gray-500 print:italic print:text-xxs"> (Arquétipo)</span>}
            {showDescription && <span className="print:block print:text-gray-500 print:text-xxs print:pl-2 print:leading-tight">{item.description.split('\n')[0]}</span>}
          </div>
        )) : <div className="print:border-b print:border-dotted print:border-gray-400 print:pb-px print:text-xs print:text-gray-400">(Nenhum)</div>}
        {Array.from({ length: Math.max(0, (title === 'VANTAGENS' || title === 'DESVANTAGENS' ? 8 : (title === 'TÉCNICAS E TRUQUES' ? 7 : 5)) - items.length) }).map((_, i) => (
          <div key={`empty-${title}-${i}`} className="print:border-b print:border-dotted print:border-gray-400 print:h-3"></div>
        ))}
      </div>
    </div>
  );
  
  const printInventoryItems = (items: SelectedEquipmentItem[]) => (
    <div className="print:grid print:grid-cols-3 print:gap-1">
      {items.map(item => (
        <div key={item.id} className="print:text-xxs print:border print:border-gray-400 print:p-0.5 print:leading-tight">
          {item.name} {item.quantity > 1 ? `(x${item.quantity})` : ''}
        </div>
      ))}
    </div>
  );


  return (
    <div className="max-w-5xl mx-auto bg-slate-850 p-5 sm:p-8 rounded-xl shadow-2xl print:shadow-none print:bg-white print:text-black print:p-1">
      <style>{`
        @media print {
          @page { size: A4; margin: 0.5cm; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: Arial, sans-serif; font-size: 10px; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print\\:text-black { color: black !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:bg-gray-50 { background-color: #f9fafb !important; }
          .print\\:border { border: 1px solid #000 !important; }
          .print\\:border-b { border-bottom-width: 1px !important; }
          .print\\:border-b-2 { border-bottom-width: 2px !important; }
          .print\\:border-dotted { border-style: dotted !important; }
          .print\\:border-gray-400 { border-color: #9ca3af !important; }
          .print\\:border-black { border-color: #000 !important; }
          .print\\:font-bold { font-weight: bold !important; }
          .print\\:text-xs { font-size: 0.65rem !important; line-height: 0.8rem !important; }
          .print\\:text-xxs { font-size: 0.55rem !important; line-height: 0.7rem !important; }
          .print\\:text-sm { font-size: 0.75rem !important; line-height: 1rem !important; }
          .print\\:text-lg { font-size: 1rem !important; }
          .print\\:text-2xl { font-size: 1.5rem !important; }
          .print\\:uppercase { text-transform: uppercase !important; }
          .print\\:flex { display: flex !important; }
          .print\\:grid { display: grid !important; }
          .print\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .print\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .print\\:col-span-1 { grid-column: span 1 / span 1 !important; }
          .print\\:col-span-2 { grid-column: span 2 / span 2 !important; }
          .print\\:gap-px { gap: 1px !important; }
          .print\\:gap-1 { gap: 0.25rem !important; }
          .print\\:gap-2 { gap: 0.5rem !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:p-0\\.5 { padding: 0.125rem !important; }
          .print\\:p-1 { padding: 0.25rem !important; }
          .print\\:pt-1 { padding-top: 0.25rem !important; }
          .print\\:pb-px { padding-bottom: 1px !important; }
          .print\\:m-0 { margin: 0 !important; }
          .print\\:mb-0\\.5 { margin-bottom: 0.125rem !important; }
          .print\\:mb-1 { margin-bottom: 0.25rem !important; }
          .print\\:mb-2 { margin-bottom: 0.5rem !important; }
          .print\\:mr-2 { margin-right: 0.5rem !important; }
          .print\\:ml-1 { margin-left: 0.25rem !important; }
          .print\\:items-end { align-items: flex-end !important; }
          .print\\:items-center { align-items: center !important; }
          .print\\:justify-between { justify-content: space-between !important; }
          .print\\:justify-around { justify-content: space-around !important; }
          .print\\:flex-grow { flex-grow: 1 !important; }
          .print\\:w-10 { width: 2.5rem !important; }
          .print\\:w-12 { width: 3rem !important; }
          .print\\:text-center { text-align: center !important; }
          .print\\:leading-tight { line-height: 1.25 !important; }
          .print\\:pl-2 { padding-left: 0.5rem !important; }
          .print\\:max-w-full { max-width: 100% !important; }
          .print\\:max-h-28 { max-height: 7rem !important; } /* approx 100px */
          .print\\:object-contain { object-fit: contain !important; }
          .print\\:fixed { position: fixed !important; }
          .print\\:bottom-2 { bottom: 0.5rem !important; }
          .print\\:right-2 { right: 0.5rem !important; }
          .print-logo { font-family: 'Orbitron', sans-serif; font-weight: bold; font-size: 1.2rem; border: 2px solid black; padding: 0.1rem 0.3rem; display: inline-block; letter-spacing: -1px; }
          .print-ficha-title { font-family: 'Orbitron', sans-serif; font-weight: bold; font-size: 1.5rem; text-align: center; margin-bottom: 0.5rem;}
        }
      `}</style>
      
      <div className="hidden print-only print:p-0 print:m-0">
        {/* ... (Print layout structure - largely unchanged but uses updated printSection for techniques) ... */}
        <div className="print:flex print:justify-between print:items-center print:mb-2">
            <div className="print-logo">3DT</div>
            <div className="print-ficha-title">FICHA DE PERSONAGEM</div>
            <div className="print:text-xs print:font-bold">Sua Ficha</div>
        </div>
        <div className="print:grid print:grid-cols-3 print:gap-2">
            <div className="print:col-span-1 print:space-y-1">
                {printNameField("Nome", character.name)}
                {printNameField("Arquétipo", archetype?.name || "")}
                {printNameField("Conceito", character.conceito)}
                <div className="print:flex print:gap-1 print:pt-1">
                    {/* ... (Escala, Pts, XP boxes) ... */}
                     <div className="print:border print:border-black print:p-0.5 print:text-center print:text-xxs print:flex-grow">
                        <div className="print:font-bold">Escala</div>
                        <div>{character.escala}</div>
                    </div>
                    <div className="print:border print:border-black print:p-0.5 print:text-center print:text-xxs print:flex-grow">
                        <div className="print:font-bold">Pts</div>
                        <div>{character.nivelDePoder}</div>
                    </div>
                     <div className="print:border print:border-black print:p-0.5 print:text-center print:text-xxs print:flex-grow">
                        <div className="print:font-bold">XP</div>
                        <div>{character.xp}</div>
                    </div>
                </div>
                <div className="print:flex print:justify-around print:pt-1">
                    {printAttributeBox("P", attributes.poder, true)}
                    {printAttributeBox("H", attributes.habilidade, true)}
                    {printAttributeBox("R", attributes.resistencia, true)}
                </div>
                <div className="print:flex print:justify-around">
                    {printAttributeBox("PA", attributes.pontosDeAcao)}
                    {printAttributeBox("PM", attributes.pontosDeMana)}
                    {printAttributeBox("PV", attributes.pontosDeVida)}
                </div>
                 {character.avatarUrl && (
                  <div className="print:border print:border-black print:p-0.5 print:mt-1 print:flex print:justify-center print:items-center" style={{ minHeight: '100px'}}>
                    <img src={character.avatarUrl} alt="Avatar" className="print:max-w-full print:max-h-28 print:object-contain" onError={(e) => (e.currentTarget.style.display = 'none')}/>
                  </div>
                )}
                {!character.avatarUrl && <div className="print:border print:border-black print:p-1 print:mt-1 print:h-28 print:flex print:justify-center print:items-center print:text-gray-400 print:text-sm">(Sem Avatar)</div>}
                <div className="print:pt-1">
                    <h4 className="print:font-bold print:text-xs print:uppercase print:border-b-2 print:border-black print:mb-0.5">Inventário</h4>
                    {printInventoryItems(equipment.filter(e => e.subtype === 'Consumível'))}
                    <div className="print:grid print:grid-cols-3 print:gap-px print:mt-0.5">
                        {Array.from({length: 9 - equipment.filter(e => e.subtype === 'Consumível').length }).map((_, i) => <div key={`inv-empty-${i}`} className="print:border print:border-gray-400 print:h-4"></div>)}
                    </div>
                    <div className="print:flex print:justify-between print:text-xxs print:mt-px">
                        <span>comuns</span><span>incomuns</span><span>raro</span>
                    </div>
                </div>
            </div>
            <div className="print:col-span-2 print:space-y-1 print:pl-2">
                {printSection("Vantagens", advantages, true)}
                {printSection("Desvantagens", disadvantages, true)}
                {printSection("Perícias", skills)}
                {printSection("Técnicas e Truques", techniquesAndTricks)} {/* UPDATED TITLE */}
                {printSection("Artefatos", equipment.filter(e => e.subtype === 'Artefato'))}
                <div className="print:flex print:justify-end print:gap-1 print:mt-2 print:fixed print:bottom-2 print:right-2">
                    {printAttributeBox("PA", attributes.pontosDeAcao)}
                    {printAttributeBox("PM", attributes.pontosDeMana)}
                    {printAttributeBox("PV", attributes.pontosDeVida)}
                </div>
            </div>
        </div>
      </div>
      
      <div className="no-print">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-4 bg-slate-800/60 rounded-lg shadow-md">
            {character.avatarUrl ? (
              <img 
                src={character.avatarUrl} 
                alt={`Avatar de ${character.name}`} 
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-sky-500 shadow-lg flex-shrink-0"
              />
            ) : (
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-slate-700 flex items-center justify-center text-sky-400 text-5xl font-bold border-4 border-sky-500 shadow-lg flex-shrink-0">
                <ImageIcon size={64}/>
              </div>
            )}
            <div className="text-center sm:text-left flex-grow">
              <h1 className="text-3xl sm:text-4xl font-bold text-sky-400">{character.name}</h1>
              <p className="text-md text-amber-300 font-mono">{character.conceito}</p>
              <p className="text-sm text-slate-400">Escala: {character.escala} | Nível de Poder (PP): {character.nivelDePoder} | XP: {character.xp}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <WebAttributeStatGroup attributeName="Poder (P)" attributeValue={attributes.poder} derivedStatName="Pontos de Ação (PA)" derivedStatValue={attributes.pontosDeAcao} icon={<Swords size={20}/>} colorClass="border-red-500/50" />
            <WebAttributeStatGroup attributeName="Habilidade (H)" attributeValue={attributes.habilidade} derivedStatName="Pontos de Mana (PM)" derivedStatValue={attributes.pontosDeMana} icon={<Brain size={20}/>} colorClass="border-blue-500/50" />
            <WebAttributeStatGroup attributeName="Resistência (R)" attributeValue={attributes.resistencia} derivedStatName="Pontos de Vida (PV)" derivedStatValue={attributes.pontosDeVida} icon={<HeartPulse size={20}/>} colorClass="border-green-500/50" />
          </div>
          
          <WebSectionTitle title="Aparência" icon={<Palette size={18}/>} />
          <p className="text-slate-300 mb-6 whitespace-pre-line bg-slate-800/40 p-3 rounded-md">{character.aparencia || "Não definida."}</p>

          {archetype && (
            <div className="mb-6">
              <WebSectionTitle title="Arquétipo" icon={<Users size={18}/>} />
              <WebItemCard item={archetype} costText={getItemCostText(archetype)} colorClass="bg-cyan-600/30" onClick={() => openDetailModal(archetype)} />
            </div>
          )}
          {skills.length > 0 && (
            <div className="mb-6">
              <WebSectionTitle title="Perícias" icon={<BookOpen size={18}/>} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {skills.map(s => <WebItemCard key={s.id} item={s} costText={getItemCostText(s)} colorClass="bg-yellow-600/20" onClick={() => openDetailModal(s)} />)}
              </div>
            </div>
          )}
          {advantages.length > 0 && (
            <div className="mb-6">
              <WebSectionTitle title="Vantagens" icon={<ShieldCheck size={18}/>} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {advantages.map(v => <WebItemCard key={v.id} item={v} costText={getItemCostText(v)} colorClass="bg-green-600/20" isFromArchetype={v.isFromArchetype} onClick={() => openDetailModal(v)} />)}
              </div>
            </div>
          )}
          {disadvantages.length > 0 && (
            <div className="mb-6">
              <WebSectionTitle title="Desvantagens" icon={<XCircle size={18} />} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {disadvantages.map(d => <WebItemCard key={d.id} item={d} costText={getItemCostText(d)} colorClass="bg-red-600/20" isFromArchetype={d.isFromArchetype} onClick={() => openDetailModal(d)} />)}
              </div>
            </div>
          )}
          {techniquesAndTricks.length > 0 && (
            <div className="mb-6">
              <WebSectionTitle title="Técnicas & Truques" icon={<Wand2 size={18} />} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {techniquesAndTricks.map(t => <WebItemCard key={t.id} item={t} costText={getItemCostText(t)} colorClass="bg-indigo-600/20" onClick={() => openDetailModal(t)} />)}
              </div>
            </div>
          )}
           {equipment.length > 0 && (
            <div className="mb-6">
              <WebSectionTitle title="Artefatos & Consumíveis" icon={<Gem size={18}/>} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                 {equipment.map(e => <WebItemCard key={e.id} item={e} costText={getItemCostText(e)} colorClass={e.subtype === 'Artefato' ? "bg-emerald-600/20" : "bg-pink-600/20"} onClick={() => openDetailModal(e)} />)}
              </div>
            </div>
          )}
          {character.history && (
             <div className="mb-6">
                <WebSectionTitle title="História & Objetivos" icon={<HistoryIcon size={18}/>} />
                <p className="text-slate-300 whitespace-pre-line bg-slate-800/40 p-3 rounded-md">{character.history}</p>
            </div>
          )}
          {character.notes && (
            <div className="mb-6">
                <WebSectionTitle title="Anotações Livres" icon={<StickyNote size={18}/>} />
                <p className="text-slate-300 whitespace-pre-line bg-slate-800/40 p-3 rounded-md">{character.notes}</p>
            </div>
          )}
      </div>
      
      <div className="mt-10 flex flex-wrap gap-3 justify-center no-print">
        <Link to="/characters" className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-5 rounded-lg transition duration-300">
          Voltar para Galeria
        </Link>
        <Link to={`/character/edit/${id}`} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg transition duration-300">
          Editar Ficha
        </Link>
        <button
          onClick={handlePrint}
          className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-5 rounded-lg transition duration-300"
        >
          Exportar para PDF (Imprimir)
        </button>
      </div>

      {isDetailModalOpen && detailModalItem && (
        <div 
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] no-print" 
            onClick={closeDetailModal}
            aria-modal="true"
            role="dialog"
        >
          <div 
            className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto relative border border-slate-700" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={closeDetailModal} 
              className="absolute top-3 right-3 text-slate-400 hover:text-sky-400"
              aria-label="Fechar detalhes"
            >
              <XCircle size={24} />
            </button>
            <h4 className="text-2xl font-bold text-sky-400 mb-2">
                {detailModalItem.name}
                {'currentLevel' in detailModalItem && detailModalItem.currentLevel && detailModalItem.type !== 'Arquétipo' && ` (Nível ${detailModalItem.currentLevel})`}
                 {('quantity' in detailModalItem && detailModalItem.quantity && detailModalItem.quantity > 1 && (detailModalItem.type === 'Consumível' || detailModalItem.subtype === 'Consumível')) && ` (x${detailModalItem.quantity})`}
            </h4>
            <p className="text-sm text-amber-300 mb-1">{detailModalItem.type}{detailModalItem.subtype ? ` - ${detailModalItem.subtype}` : ''}</p>
            <p className="text-sm text-slate-400 mb-3">{getItemCostText(detailModalItem)}</p>
            
            <div className="text-slate-300 leading-relaxed whitespace-pre-line mb-4" dangerouslySetInnerHTML={{ __html: detailModalItem.description.replace(/\n/g, "<br />").replace(/•/g, "<br />• ") }} />

            {'costDetails' in detailModalItem && detailModalItem.costDetails && (
              <div className="mb-3 p-2 bg-slate-700/50 rounded">
                <p className="text-sm font-semibold text-sky-300">Detalhes do Custo:</p>
                <p className="text-xs text-slate-300 whitespace-pre-line">{detailModalItem.costDetails}</p>
              </div>
            )}
            {'rules' in detailModalItem && detailModalItem.rules && (
              <div className="mb-3 p-2 bg-slate-700/50 rounded">
                <p className="text-sm font-semibold text-sky-300">Regras Adicionais:</p>
                <p className="text-xs text-slate-300 whitespace-pre-line">{detailModalItem.rules}</p>
              </div>
            )}
            {'prerequisites' in detailModalItem && detailModalItem.prerequisites && detailModalItem.prerequisites.toLowerCase() !== 'n/a' && detailModalItem.prerequisites.trim() !== '' && (
                 <div className="mb-3 p-2 bg-slate-700/50 rounded">
                    <p className="text-sm font-semibold text-sky-300">Pré-requisitos:</p>
                    <p className="text-xs text-slate-300 whitespace-pre-line">{detailModalItem.prerequisites}</p>
                </div>
            )}
            {detailModalItem.source && <p className="text-xs text-slate-500 mt-2">Fonte: {detailModalItem.source}</p>}
            
            <button 
                onClick={closeDetailModal} 
                className="mt-6 w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
            >
                Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterViewPage;
