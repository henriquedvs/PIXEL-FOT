import { MatchEnvironment, StadiumSpec, TimeOfDay, WeatherCondition } from '../types/game';
import { Club } from '../types/game';

export const STADIUMS: Record<string, StadiumSpec> = {
  'atletico-guanabara': {
    id: 'arena-baia-dourada',
    name: 'Arena Baía Dourada',
    city: 'Rio de Janeiro',
    state: 'RJ',
    capacity: 62000,
    architecture: 'grand',
    turfToneA: '#1B6E3A',
    turfToneB: '#217E43',
    standColor: '#1E293B',
    trackBorder: false,
    roofCover: true,
    floodlightStyle: 'ring',
    description: 'Arena monumental de dois anéis com cobertura periférica e iluminação em anel completo.',
  },
  'ec-paulista': {
    id: 'parque-bandeirante',
    name: 'Estádio Parque Bandeirante',
    city: 'São Paulo',
    state: 'SP',
    capacity: 54000,
    architecture: 'modern',
    turfToneA: '#176635',
    turfToneB: '#1B753D',
    standColor: '#162030',
    trackBorder: false,
    roofCover: true,
    floodlightStyle: 'ring',
    description: 'Estádio moderno retangular de linhas limpas, fosso curto e acústica fechada.',
  },
  'gremio-araucaria': {
    id: 'caldeirao-pinheiros',
    name: 'Caldeirão dos Pinheiros',
    city: 'Curitiba',
    state: 'PR',
    capacity: 41000,
    architecture: 'cauldron',
    turfToneA: '#165D31',
    turfToneB: '#1A6B39',
    standColor: '#10241D',
    trackBorder: false,
    roofCover: true,
    floodlightStyle: 'towers',
    description: 'Arquibancadas verticais coladas no gramado que amplificam o canto da torcida.',
  },
  'real-baiano': {
    id: 'fonte-do-sol',
    name: 'Fonte do Sol',
    city: 'Salvador',
    state: 'BA',
    capacity: 46000,
    architecture: 'modern',
    turfToneA: '#1E743D',
    turfToneB: '#238245',
    standColor: '#17253B',
    trackBorder: false,
    roofCover: true,
    floodlightStyle: 'ring',
    description: 'Arena aberta ao vento atlântico com anel superior vibrante e refletor de alta potência.',
  },
  'estrela-gaucha': {
    id: 'monumental-pampa',
    name: 'Monumental do Pampa',
    city: 'Porto Alegre',
    state: 'RS',
    capacity: 48500,
    architecture: 'traditional',
    turfToneA: '#186334',
    turfToneB: '#1D703C',
    standColor: '#1B2432',
    trackBorder: true,
    roofCover: false,
    floodlightStyle: 'towers',
    description: 'Clássico estádio olímpico gaúcho com pista periférica e quatro torres de refletores.',
  },
  'cruzeiro-cerrado': {
    id: 'serra-dourada-sul',
    name: 'Serra Dourada Sul',
    city: 'Goiânia',
    state: 'GO',
    capacity: 32000,
    architecture: 'traditional',
    turfToneA: '#20753A',
    turfToneB: '#258442',
    standColor: '#262118',
    trackBorder: true,
    roofCover: false,
    floodlightStyle: 'towers',
    description: 'Estádio amplo do Centro-Oeste de gramado rápido e arquibancadas ensolaradas.',
  },
  'leao-nordeste': {
    id: 'ilha-brava',
    name: 'Ilha Brava',
    city: 'Recife',
    state: 'PE',
    capacity: 35000,
    architecture: 'cauldron',
    turfToneA: '#1E7037',
    turfToneB: '#237D3F',
    standColor: '#291518',
    trackBorder: false,
    roofCover: false,
    floodlightStyle: 'towers',
    description: 'Caldeirão nordestino conhecido pela pressão incessante e arquibancadas rubro-amarelas.',
  },
  'operario-mineiro': {
    id: 'arena-das-gerais',
    name: 'Arena das Gerais',
    city: 'Belo Horizonte',
    state: 'MG',
    capacity: 38000,
    architecture: 'traditional',
    turfToneA: '#1A6836',
    turfToneB: '#1F763E',
    standColor: '#1E232C',
    trackBorder: false,
    roofCover: true,
    floodlightStyle: 'ring',
    description: 'Tradicional casa mineira com fachada histórica e cobertura metálica sobre as sociais.',
  },
  'ferroviaria-amazonica': {
    id: 'estadio-rio-negro',
    name: 'Estádio Rio Negro',
    city: 'Manaus',
    state: 'AM',
    capacity: 26000,
    architecture: 'municipal',
    turfToneA: '#1D743B',
    turfToneB: '#228344',
    standColor: '#13261B',
    trackBorder: true,
    roofCover: false,
    floodlightStyle: 'poles',
    description: 'Estádio regional cercado por vegetação tropical e clima úmido característico.',
  },
  'vila-nova-litoral': {
    id: 'brisa-do-mar',
    name: 'Estádio Brisa do Mar',
    city: 'Santos',
    state: 'SP',
    capacity: 22000,
    architecture: 'compact',
    turfToneA: '#1B6E3A',
    turfToneB: '#217D43',
    standColor: '#132836',
    trackBorder: false,
    roofCover: false,
    floodlightStyle: 'poles',
    description: 'Alçapão litorâneo compacto onde a torcida fica a poucos metros da linha lateral.',
  },
  'juventus-pantaneira': {
    id: 'arena-das-aguas',
    name: 'Arena das Águas',
    city: 'Cuiabá',
    state: 'MT',
    capacity: 24000,
    architecture: 'municipal',
    turfToneA: '#1F7338',
    turfToneB: '#248140',
    standColor: '#231A35',
    trackBorder: true,
    roofCover: false,
    floodlightStyle: 'poles',
    description: 'Estádio municipal aconchegante de arquibancadas abertas e noites quentes.',
  },
  'uniao-catarinense': {
    id: 'estadio-da-ponte',
    name: 'Estádio da Ponte',
    city: 'Florianópolis',
    state: 'SC',
    capacity: 21500,
    architecture: 'compact',
    turfToneA: '#196A37',
    turfToneB: '#1E783F',
    standColor: '#281A14',
    trackBorder: false,
    roofCover: false,
    floodlightStyle: 'poles',
    description: 'Estádio ilhéu compacto com ótima visibilidade e vento constante vindo da ponte.',
  },
};

export function getStadiumForClub(club: Club): StadiumSpec {
  return STADIUMS[club.id] || STADIUMS['vila-nova-litoral'];
}

export function generateMatchEnvironment(params: {
  homeClub: Club;
  competitionName: string;
  roundLabel: string;
  dateStr: string;
  seed: number;
}): MatchEnvironment {
  const stadium = getStadiumForClub(params.homeClub);
  const times: { tod: TimeOfDay; hour: string }[] = [
    { tod: 'Manhã', hour: '10:30' },
    { tod: 'Tarde', hour: '16:00' },
    { tod: 'Fim de tarde', hour: '18:30' },
    { tod: 'Noite', hour: '21:00' },
  ];
  const pickTime = times[(params.seed * 3 + params.homeClub.foundedYear) % times.length];

  const weathers: WeatherCondition[] = [
    'Ensolarado',
    'Ensolarado',
    'Nublado',
    'Chuva fraca',
    'Chuva forte',
  ];
  // Night matches cannot be "Ensolarado" — swap to "Nublado" or clear night ("Céu limpo" mapped via Ensolarado->Noite limpa or Nublado)
  let weather = weathers[(params.seed * 5 + stadium.capacity) % weathers.length];
  if (pickTime.tod === 'Noite' && weather === 'Ensolarado') {
    weather = 'Nublado';
  }

  // Coherent temperature by city latitude + time of day + weather
  const warmStates = ['AM', 'PE', 'BA', 'MT', 'GO', 'RJ'];
  const baseTemp = warmStates.includes(params.homeClub.state) ? 28 : 21;
  const timeAdj =
    pickTime.tod === 'Manhã'
      ? -2
      : pickTime.tod === 'Tarde'
      ? 3
      : pickTime.tod === 'Fim de tarde'
      ? 0
      : -4;
  const rainAdj = weather.includes('Chuva') ? -3 : weather === 'Nublado' ? -1 : 1;
  const temperatureC = Math.max(12, Math.min(36, baseTemp + timeAdj + rainAdj));

  return {
    competitionName: params.competitionName,
    roundLabel: params.roundLabel,
    dateStr: params.dateStr,
    kickoffTime: pickTime.hour,
    timeOfDay: pickTime.tod,
    weather,
    temperatureC,
    stadium,
  };
}
