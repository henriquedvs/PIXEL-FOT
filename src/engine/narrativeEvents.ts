import { getClubById } from '../data/clubs';
import { CalendarDay, NarrativeEvent, NarrativeEventCategory, PlayerCareer } from '../types/game';

export function buildInteractiveEventForDay(
  career: PlayerCareer,
  day: CalendarDay
): NarrativeEvent {
  const club = getClubById(career.clubId);
  const playerName = career.personal.nickname || career.personal.firstName;
  const upcomingMatch = career.calendar.find(
    (d, i) => i >= day.dayIndex && d.activity === 'PARTIDA' && !d.completed
  );
  const opp = upcomingMatch?.opponentClubId ? getClubById(upcomingMatch.opponentClubId) : null;
  const seed = career.season * 313 + day.dayIndex * 17 + career.round;

  let category: NarrativeEventCategory = 'VESTIARIO';
  if (day.activity === 'COMPROMISSO') {
    category = seed % 2 === 0 ? 'COLETIVA' : 'ZONA_MISTA';
  } else if (day.activity === 'ESPECIAL') {
    category =
      career.contract.yearsRemaining <= 1 && seed % 3 === 0
        ? 'CONTRATO'
        : 'ESPECIAL';
  } else if (day.activity === 'TREINO') {
    category = seed % 2 === 0 ? 'TREINADOR' : 'VESTIARIO';
  } else if (day.activity === 'VIAGEM') {
    category = 'VESTIARIO';
  } else {
    category = 'ESPECIAL';
  }

  const contextTag = opp
    ? `Pré-jogo vs ${opp.shortName} · ${upcomingMatch?.competition || career.division || 'Série A'}`
    : `${club.name} · Temporada ${career.season}`;

  if (category === 'COLETIVA') {
    const isUnderPressure = career.morale < 60 || career.coachTrust < 55;
    return {
      id: `evt_${career.season}_${day.dayIndex}_col`,
      category: 'COLETIVA',
      title: 'Coletiva de Imprensa Oficial',
      speakerName: 'Repórter Setorista',
      speakerRole: 'Sala de Imprensa · ' + club.stadiumName,
      contextTag,
      prompt: isUnderPressure
        ? `${playerName}, a torcida cobra reação imediata após os últimos resultados${opp ? ` antes de enfrentar o ${opp.name}` : ''}. Como você enxerga o momento do grupo e seu papel em campo?`
        : `${playerName}, você vem ganhando espaço com ${club.coachName}${opp ? ` e o duelo contra o ${opp.name} promete casa cheia` : ''}. Qual é a mentalidade para os próximos jogos?`,
      choices: [
        {
          id: 'c_confident',
          label: 'Prometer entrega máxima e buscar a vitória',
          tone: 'Confiante',
          responseText: '“Estamos focados em impor nosso ritmo desde o primeiro minuto. Vamos jogar para vencer.”',
          effects: { morale: 5, fanSupport: 6, popularity: 4, pressRelation: 2, teamChemistry: 1 },
        },
        {
          id: 'c_team',
          label: 'Valorizar o trabalho coletivo e o plano do treinador',
          tone: 'Diplomático',
          responseText: `“O mérito é de todo o elenco e da comissão técnica do ${club.coachName}. Seguimos unidos.”`,
          effects: { coachTrust: 5, teamChemistry: 5, pressRelation: 4, morale: 2 },
        },
        {
          id: 'c_humble',
          label: 'Reconhecer que há ajustes técnicos a evoluir',
          tone: 'Autocrítico',
          responseText: '“Sabemos onde precisamos melhorar nos treinos para entregar um futebol mais consistente.”',
          effects: { coachTrust: 4, pressRelation: 5, xp: 20, morale: -1 },
        },
      ],
    };
  }

  if (category === 'ZONA_MISTA') {
    return {
      id: `evt_${career.season}_${day.dayIndex}_zm`,
      category: 'ZONA_MISTA',
      title: 'Entrevista na Zona Mista',
      speakerName: 'Imprensa Esportiva',
      speakerRole: 'Corredor de Acesso',
      contextTag,
      prompt: `${playerName}, seus números na temporada (${career.seasonStats.goals} gol(s), ${career.seasonStats.assists} assistência(s)) chamam atenção. Você se sente pronto para assumir ainda mais protagonismo no ${club.shortName}?`,
      choices: [
        {
          id: 'zm_star',
          label: 'Assumir a responsabilidade nos momentos decisivos',
          tone: 'Confiante',
          responseText: '“Eu treino todos os dias para decidir jogos grandes. Quero sempre a bola nos momentos quentes.”',
          effects: { popularity: 5, fanSupport: 5, morale: 4, pressRelation: 2 },
        },
        {
          id: 'zm_group',
          label: 'Destacar a parceria com os companheiros de elenco',
          tone: 'Diplomático',
          responseText: '“Nenhum jogador brilha sozinho. Meus números refletem a confiança que o grupo me passa.”',
          effects: { teamChemistry: 6, morale: 3, pressRelation: 4 },
        },
        {
          id: 'zm_focus',
          label: 'Manter os pés no chão e focar no próximo treino',
          tone: 'Focado',
          responseText: '“Os números ajudam, mas o campeonato é longo. Meu foco está 100% na próxima partida.”',
          effects: { coachTrust: 4, xp: 25, pressRelation: 3 },
        },
      ],
    };
  }

  if (category === 'TREINADOR') {
    return {
      id: `evt_${career.season}_${day.dayIndex}_coach`,
      category: 'TREINADOR',
      title: `Conversa Particular com ${club.coachName}`,
      speakerName: club.coachName,
      speakerRole: `Técnico · ${club.name}`,
      contextTag,
      prompt: `${playerName}, estive analisando seu desempenho na formação ${club.formation}${opp ? ` pensando no confronto contra o ${opp.shortName}` : ''}. Como prefere contribuir taticamente nesta semana?`,
      choices: [
        {
          id: 'tr_intensity',
          label: 'Dobrar intensidade nos treinos táticos e físicos',
          tone: 'Focado',
          responseText: `“Professor, quero ajustar meu posicionamento e ganhar ritmo mesmo que custe um pouco mais de desgaste.”`,
          effects: { coachTrust: 6, xp: 35, fatigue: 5, morale: 2 },
        },
        {
          id: 'tr_liberty',
          label: 'Pedir liberdade criativa para atacar os espaços',
          tone: 'Confiante',
          responseText: '“Quando recebo entre linhas consigo criar mais chances claras para o ataque.”',
          effects: { morale: 5, coachTrust: 2, teamChemistry: 2, xp: 15 },
        },
        {
          id: 'tr_discipline',
          label: 'Priorizar disciplina defensiva e recomposição',
          tone: 'Diplomático',
          responseText: '“Vou ajudar o time na marcação e fechar os corredores quando estivermos sem a bola.”',
          effects: { coachTrust: 7, teamChemistry: 4, xp: 20 },
        },
      ],
    };
  }

  if (category === 'VESTIARIO') {
    return {
      id: `evt_${career.season}_${day.dayIndex}_vest`,
      category: 'VESTIARIO',
      title: 'Clima no Vestiário',
      speakerName: club.squad[2]?.name || 'Capitão do Elenco',
      speakerRole: `Líder do Vestiário · ${club.shortName}`,
      contextTag,
      prompt: `Antes da sequência pesada de jogos${opp ? ` começando contra o ${opp.name}` : ''}, o elenco se reuniu no vestiário para alinhar o discurso. Qual postura você adota diante do grupo?`,
      choices: [
        {
          id: 'vs_speech',
          label: 'Incentivar os colegas com discurso vibrante',
          tone: 'Confiante',
          responseText: 'Você cobra energia alta nos primeiros 15 minutos e levanta o astral de todo o vestiário.',
          effects: { teamChemistry: 6, morale: 5, coachTrust: 2 },
        },
        {
          id: 'vs_listen',
          label: 'Ouvir os mais experientes e oferecer apoio tático',
          tone: 'Diplomático',
          responseText: 'Sua leitura calma aproxima titulares e reservas em torno do mesmo objetivo.',
          effects: { teamChemistry: 5, coachTrust: 4, pressRelation: 2 },
        },
        {
          id: 'vs_recovery',
          label: 'Concentrar-se em silêncio e preservar energia',
          tone: 'Focado',
          responseText: 'Você faz alongamento leve, visualiza as jogadas e chega descansado para o jogo.',
          effects: { fatigue: -8, morale: 3, xp: 15 },
        },
      ],
    };
  }

  if (category === 'CONTRATO') {
    return {
      id: `evt_${career.season}_${day.dayIndex}_cont`,
      category: 'CONTRATO',
      title: 'Sondagem & Futuro Contratual',
      speakerName: 'Seu Empresário',
      speakerRole: 'Gestão de Carreira',
      contextTag,
      prompt: `${playerName}, seu contrato atual com o ${club.name} entra em reta decisiva (${career.contract.yearsRemaining} ano restante). Clubes observam suas atuações. Qual orientação você passa ao seu agente?`,
      choices: [
        {
          id: 'ct_stay',
          label: `Priorizar permanência e idolatria no ${club.shortName}`,
          tone: 'Diplomático',
          responseText: `“Quero fazer história no ${club.name}. Se vier proposta de renovação justa, minha preferência é ficar.”`,
          effects: { fanSupport: 8, coachTrust: 5, morale: 4, teamChemistry: 4 },
        },
        {
          id: 'ct_market',
          label: 'Manter portas abertas para propostas maiores',
          tone: 'Confiante',
          responseText: '“Vou responder dentro de campo e avaliar todas as opções ao fim da janela.”',
          effects: { popularity: 5, pressRelation: 3, morale: 2, fanSupport: -3 },
        },
        {
          id: 'ct_field',
          label: 'Adiar conversas e focar somente nos treinos',
          tone: 'Focado',
          responseText: '“Só me procure no fim da temporada. Agora só penso em evoluir meu futebol.”',
          effects: { coachTrust: 4, xp: 30, morale: 3 },
        },
      ],
    };
  }

  // ESPECIAL
  return {
    id: `evt_${career.season}_${day.dayIndex}_esp`,
    category: 'ESPECIAL',
    title: 'Ação com a Torcida & Comunidade',
    speakerName: 'Torcida Organizada',
    speakerRole: `${club.mascotName} · ${club.city}`,
    contextTag,
    prompt: `Dezenas de torcedores compareceram ao evento oficial do ${club.name} para tirar fotos e pedir autógrafos antes dos próximos compromissos. Como você conduz o encontro?`,
    choices: [
      {
        id: 'sp_all',
        label: 'Atender a fila inteira com calma e atenção',
        tone: 'Diplomático',
        responseText: 'Você conversa com crianças e famílias, garantindo fotos e camisas assinadas.',
        effects: { fanSupport: 8, popularity: 6, morale: 5, fatigue: 4 },
      },
      {
        id: 'sp_chant',
        label: 'Puxar o canto da arquibancada e inflamar a torcida',
        tone: 'Confiante',
        responseText: 'Os torcedores vibram junto com você, criando um clima elétrico para a próxima partida.',
        effects: { fanSupport: 9, popularity: 7, morale: 4, pressRelation: 3 },
      },
      {
        id: 'sp_quick',
        label: 'Participar rapidamente e seguir para recuperação física',
        tone: 'Focado',
        responseText: 'Você agradece o carinho, participa do protocolo e poupa energia para o treino.',
        effects: { fanSupport: 3, fatigue: -6, coachTrust: 3 },
      },
    ],
  };
}
