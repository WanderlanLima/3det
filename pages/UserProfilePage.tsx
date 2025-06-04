
import React from 'react';
import { UserProfile, CharacterSummary, CampaignSummary } from '../types'; 
import { Link } from 'react-router-dom';

const mockUser: UserProfile = {
  id: 'user123',
  name: 'Aventureiro Mestre',
  email: 'aventureiro@example.com',
  avatarUrl: 'https://via.placeholder.com/150/17a2b8/FFFFFF?Text=AM',
  bio: 'Um jogador e mestre apaixonado por 3D&T e outros RPGs de mesa. Sempre em busca da próxima grande aventura!',
  characters: [
    { id: 'char1', name: 'Valerius', conceito: 'Guerreiro Audaz', avatarUrl: 'https://via.placeholder.com/80/007bff/FFFFFF?Text=V', description: 'Um guerreiro destemido.' },
    { id: 'char2', name: 'Lyra', conceito: 'Maga Arcana', avatarUrl: 'https://via.placeholder.com/80/28a745/FFFFFF?Text=L', description: 'Uma maga estudiosa dos mistérios.' },
  ],
  campaignsAsGM: [
    { id: 'camp1', name: 'A Sombra Ancestral', description: 'Uma antiga ameaça ressurge das profundezas.', status: 'ativa', playerCount: 3, imageUrl: 'https://via.placeholder.com/100x60/dc3545/FFFFFF?Text=SA', sessionCount: 5, npcCount: 2 },
  ],
  campaignsAsPlayer: [
    { id: 'camp3', name: 'Os Segredos do Deserto', description: 'Misteriosos artefatos são descobertos nas areias escaldantes.', status: 'finalizada', gm: 'Mestre X', playerCount: 4, imageUrl: 'https://via.placeholder.com/100x60/fd7e14/FFFFFF?Text=SD', sessionCount: 12, npcCount: 0 },
  ],
};

const UserProfilePage: React.FC = () => {
  const user = mockUser; 

  const sectionTitleClass = "text-2xl font-semibold text-sky-300 mb-4 border-b border-slate-700 pb-2";
  const cardBaseClass = "bg-slate-700/50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow";

  return (
    <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl">
      <header className="flex flex-col sm:flex-row items-center mb-8">
        <img 
          src={user.avatarUrl || 'https://via.placeholder.com/150/64748b/FFFFFF?Text=?'} 
          alt={`Avatar de ${user.name}`} 
          className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover mr-0 sm:mr-8 mb-4 sm:mb-0 border-4 border-sky-500 shadow-lg"
        />
        <div>
          <h1 className="text-4xl font-bold text-sky-400">{user.name}</h1>
          <p className="text-lg text-slate-400">{user.email}</p>
          {user.bio && <p className="mt-2 text-slate-300 max-w-xl">{user.bio}</p>}
          <button className="mt-4 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 text-sm">
            Editar Perfil (Mock)
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className={sectionTitleClass}>Meus Personagens ({user.characters?.length || 0})</h2>
          {user.characters && user.characters.length > 0 ? (
            <div className="space-y-4">
              {user.characters.map((char: CharacterSummary) => (
                <Link to={`/character/edit/${char.id}`} key={char.id} className={`block ${cardBaseClass} flex items-center`}>
                  <img src={char.avatarUrl || 'https://via.placeholder.com/50/6c757d/FFFFFF?Text=?'} alt={`Avatar de ${char.name}`} className="w-12 h-12 rounded-full mr-4 object-cover"/>
                  <div>
                    <h3 className="font-semibold text-lg text-sky-200">{char.name}</h3>
                    {char.conceito && <p className="text-sm text-amber-400">{char.conceito}</p>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">Nenhum personagem criado ainda.</p>
          )}
        </section>

        <section className="space-y-6">
          <div>
            <h2 className={sectionTitleClass}>Campanhas que Mestro ({user.campaignsAsGM?.length || 0})</h2>
            {user.campaignsAsGM && user.campaignsAsGM.length > 0 ? (
              <div className="space-y-4">
                {user.campaignsAsGM.map((camp: CampaignSummary) => (
                  <Link to={`/campaign/${camp.id}`} key={camp.id} className={`block ${cardBaseClass} flex items-start`}>
                     {camp.imageUrl && <img src={camp.imageUrl} alt={`Imagem da campanha ${camp.name}`} className="w-20 h-14 object-cover rounded mr-4"/>}
                    <div>
                        <h3 className="font-semibold text-lg text-sky-200">{camp.name}</h3>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${camp.status === 'ativa' ? 'bg-green-500 text-green-100' : 'bg-slate-600 text-slate-100'}`}>
                            {camp.status.toUpperCase()}
                        </span>
                        {camp.playerCount !== undefined && <p className="text-xs text-slate-400 mt-1">{camp.playerCount} jogadores</p>}
                        {camp.sessionCount !== undefined && <p className="text-xs text-slate-400">{camp.sessionCount} sessões</p>}
                        {camp.npcCount !== undefined && camp.npcCount > 0 && <p className="text-xs text-slate-400">{camp.npcCount} NPCs</p>}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">Nenhuma campanha mestrada.</p>
            )}
          </div>
          <div>
            <h2 className={sectionTitleClass}>Campanhas que Jogo ({user.campaignsAsPlayer?.length || 0})</h2>
            {user.campaignsAsPlayer && user.campaignsAsPlayer.length > 0 ? (
              <div className="space-y-4">
                 {user.campaignsAsPlayer.map((camp: CampaignSummary) => (
                  <Link to={`/campaign/${camp.id}`} key={camp.id} className={`block ${cardBaseClass} flex items-start`}>
                     {camp.imageUrl && <img src={camp.imageUrl} alt={`Imagem da campanha ${camp.name}`} className="w-20 h-14 object-cover rounded mr-4"/>}
                    <div>
                        <h3 className="font-semibold text-lg text-sky-200">{camp.name}</h3>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${camp.status === 'ativa' ? 'bg-green-500 text-green-100' : camp.status === 'finalizada' ? 'bg-slate-600 text-slate-100' : 'bg-yellow-500 text-yellow-100' }`}>
                            {camp.status.toUpperCase()}
                        </span>
                         {camp.gm && <p className="text-xs text-slate-400 mt-1">Mestre: {camp.gm}</p>}
                         {camp.playerCount !== undefined && <p className="text-xs text-slate-400">{camp.playerCount} jogadores</p>}
                         {camp.sessionCount !== undefined && <p className="text-xs text-slate-400">{camp.sessionCount} sessões</p>}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">Não está participando de nenhuma campanha.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default UserProfilePage;