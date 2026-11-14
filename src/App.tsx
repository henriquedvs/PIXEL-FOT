import { useEffect, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { CareerHub } from './components/CareerHub';
import { CharacterCreator, CreatedCharacterDraft } from './components/CharacterCreator';
import { ClubsBrowserScreen } from './components/ClubsBrowserScreen';
import { ClubSelection } from './components/ClubSelection';
import { CompetitionsBrowserScreen } from './components/CompetitionsBrowserScreen';
import { CreditsScreen } from './components/CreditsScreen';
import { MainMenu, CareerHubTab } from './components/MainMenu';
import { MatchReportModal } from './components/MatchReportModal';
import { MatchView } from './components/MatchView';
import { NarrativeEventModal } from './components/NarrativeEventModal';
import { OrientationGuard } from './components/OrientationGuard';
import { PlayerProfileScreen } from './components/PlayerProfileScreen';
import { SeasonCalendarView } from './components/SeasonCalendarView';
import { SettingsScreen } from './components/SettingsScreen';
import { SquadBrowserScreen } from './components/SquadBrowserScreen';
import { StadiumsBrowserScreen } from './components/StadiumsBrowserScreen';
import { TitleScreen } from './components/TitleScreen';
import { getClubById } from './data/clubs';
import { calculateOverall } from './data/positions';
import { generateMatchEnvironment } from './data/stadiums';
import { simulateDetailedMatch } from './engine/matchSimulator';
import { buildInteractiveEventForDay } from './engine/narrativeEvents';
import {
  CalendarDay,
  Club,
  GameSettings,
  MatchSimReport,
  NarrativeChoice,
  NarrativeEvent,
  PlayerCareer,
  ScreenId,
  TrainingDrill,
  TransferOffer,
} from './types/game';
import {
  acceptOffer,
  advanceCalendarDay,
  advanceUntilNextMatch,
  applyMatchOutcomeToCareer,
  applyNarrativeChoice,
  completeTrainingDrill,
  createInitialCareer,
  emptyStats,
  loadCareer,
  loadSettings,
  saveCareer,
  saveSettings,
} from './utils/storage';

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('TITLE');
  const [returnScreen, setReturnScreen] = useState<ScreenId>('MAIN_MENU');
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [career, setCareer] = useState<PlayerCareer | null>(() => loadCareer());
  const [charDraft, setCharDraft] = useState<CreatedCharacterDraft | null>(null);
  const [hubTab, setHubTab] = useState<CareerHubTab>('CENTRAL');
  const [pendingSimReport, setPendingSimReport] = useState<MatchSimReport | null>(null);
  const [pendingNarrative, setPendingNarrative] = useState<{
    dayIndex: number;
    event: NarrativeEvent;
  } | null>(null);
  const [activeFixture, setActiveFixture] = useState<{
    homeClubId: string;
    awayClubId: string;
    competitionName?: string;
    fixtureId?: string;
  } | null>(null);

  useEffect(() => {
    soundEngine.updateSettings(settings);
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (career) {
      saveCareer(career);
    }
  }, [career]);

  const handleToggleTitleMusic = () => {
    setSettings((prev) => ({
      ...prev,
      audio: { ...prev.audio, musicEnabled: !prev.audio.musicEnabled },
    }));
  };

  const handleOpenSettings = (from: ScreenId) => {
    setReturnScreen(from);
    setScreen('SETTINGS');
  };

  const handleCharacterComplete = (draft: CreatedCharacterDraft) => {
    setCharDraft(draft);
    setScreen('CLUB_SELECT');
  };

  const handleCustomizationSave = (draft: CreatedCharacterDraft) => {
    if (!career) return;
    const updated: PlayerCareer = {
      ...career,
      personal: draft.personal,
      appearance: draft.appearance,
      gear: draft.gear,
    };
    setCareer(updated);
    saveCareer(updated);
    setScreen(returnScreen === 'PLAYER_PROFILE' ? 'PLAYER_PROFILE' : 'MAIN_MENU');
  };

  const handleClubSelected = (club: Club) => {
    if (!charDraft) return;
    const newCareer = createInitialCareer({
      ...charDraft,
      club,
    });
    setCareer(newCareer);
    saveCareer(newCareer);
    setHubTab('CENTRAL');
    setScreen('CAREER_HUB');
  };

  const handleStartMatch = (
    homeClubId: string,
    awayClubId: string,
    competitionName?: string,
    fixtureId?: string
  ) => {
    if (settings.orientation === 'landscape-locked' && 'orientation' in window.screen) {
      const ori = window.screen.orientation as ScreenOrientation & {
        lock?: (mode: string) => Promise<void>;
      };
      ori.lock?.('landscape').catch(() => {});
    }
    setActiveFixture({ homeClubId, awayClubId, competitionName, fixtureId });
    setScreen('MATCH');
  };

  const handleInjurySkip = (homeClubId: string, awayClubId: string) => {
    if (!career) return;
    const hs = Math.floor(Math.random() * 3);
    const as = Math.floor(Math.random() * 3);
    const next = applyMatchOutcomeToCareer(career, {
      homeClubId,
      awayClubId,
      homeScore: hs,
      awayScore: as,
      playerStats: emptyStats(),
      rating: 6.5,
      motm: false,
    });
    setCareer(next);
  };

  const handleAdvanceDay = () => {
    if (!career) return;
    setCareer(advanceCalendarDay(career));
  };

  const handleAdvanceToNextMatch = () => {
    if (!career) return;
    setCareer(advanceUntilNextMatch(career));
  };

  const handleCompleteDrill = (
    drill: TrainingDrill,
    medal: 'Ouro' | 'Prata' | 'Bronze'
  ) => {
    if (!career) return;
    setCareer(completeTrainingDrill(career, drill, medal));
  };

  const handleAcceptOffer = (offer: TransferOffer) => {
    if (!career) return;
    setCareer(acceptOffer(career, offer));
  };

  const handleSimulateMatch = (
    homeClubId: string,
    awayClubId: string,
    competitionName?: string,
    fixtureId?: string
  ) => {
    if (!career) return;
    const homeClub = getClubById(homeClubId);
    const awayClub = getClubById(awayClubId);
    const comp = competitionName || `Brasileirão ${career.division || 'Série A'}`;
    const env = generateMatchEnvironment({
      homeClub,
      competitionName: comp,
      roundLabel: `Rodada ${career.round}`,
      dateStr: career.calendar[career.currentDayIndex]?.dateLabel || '2026',
      seed: career.season * 100 + career.round + career.currentDayIndex,
    });
    const isKnockout =
      comp.includes('Supercopa') ||
      comp.includes('Final') ||
      comp.includes('Volta');

    const { report, outcomePayload } = simulateDetailedMatch(career, homeClub, awayClub, {
      competition: comp,
      fixtureId,
      stadiumName: env.stadium.name,
      weather: env.weather,
      isKnockout,
    });
    const next = applyMatchOutcomeToCareer(career, outcomePayload);
    setCareer(next);
    setPendingSimReport(report);
  };

  const handleTriggerNarrativeEvent = (day: CalendarDay) => {
    if (!career) return;
    setPendingNarrative({
      dayIndex: day.dayIndex,
      event: buildInteractiveEventForDay(career, day),
    });
  };

  const handleResolveNarrativeChoice = (choice: NarrativeChoice) => {
    if (!career || !pendingNarrative) return;
    const next = applyNarrativeChoice(
      career,
      pendingNarrative.dayIndex,
      pendingNarrative.event,
      choice
    );
    setCareer(next);
  };

  return (
    <>
      <OrientationGuard />

      {screen === 'TITLE' && (
        <TitleScreen
          settings={settings}
          onToggleMusic={handleToggleTitleMusic}
          onPlay={() => setScreen('MAIN_MENU')}
        />
      )}

      {screen === 'MAIN_MENU' && (
        <MainMenu
          career={career}
          onContinueCareer={() => {
            setHubTab('CENTRAL');
            setScreen('CAREER_HUB');
          }}
          onNewCareer={() => setScreen('CHAR_CREATOR')}
          onOpenPlayerProfile={() => setScreen('PLAYER_PROFILE')}
          onOpenSquad={() => setScreen('SQUAD_BROWSER')}
          onOpenClubs={() => setScreen('CLUBS_BROWSER')}
          onOpenStadiums={() => setScreen('STADIUMS_BROWSER')}
          onOpenCompetitions={() => setScreen('COMPETITIONS_BROWSER')}
          onOpenCalendar={() => setScreen('CALENDAR_BROWSER')}
          onOpenCareerTab={(t) => {
            setHubTab(t);
            setScreen('CAREER_HUB');
          }}
          onPlayNextMatch={handleStartMatch}
          onSimulateNextMatch={handleSimulateMatch}
          onOpenCustomization={() => {
            setReturnScreen('MAIN_MENU');
            setScreen('CUSTOMIZATION');
          }}
          onOpenSettings={() => handleOpenSettings('MAIN_MENU')}
          onOpenCredits={() => setScreen('CREDITS')}
        />
      )}

      {screen === 'PLAYER_PROFILE' && (
        <PlayerProfileScreen
          career={career}
          onBack={() => setScreen('MAIN_MENU')}
          onStartNewCareer={() => setScreen('CHAR_CREATOR')}
          onCustomize={() => {
            setReturnScreen('PLAYER_PROFILE');
            setScreen('CUSTOMIZATION');
          }}
        />
      )}

      {screen === 'SQUAD_BROWSER' && (
        <SquadBrowserScreen
          career={career}
          onBack={() => setScreen('MAIN_MENU')}
          onStartNewCareer={() => setScreen('CHAR_CREATOR')}
        />
      )}

      {screen === 'CLUBS_BROWSER' && (
        <ClubsBrowserScreen onBack={() => setScreen('MAIN_MENU')} />
      )}

      {screen === 'STADIUMS_BROWSER' && (
        <StadiumsBrowserScreen onBack={() => setScreen('MAIN_MENU')} />
      )}

      {screen === 'COMPETITIONS_BROWSER' && (
        <CompetitionsBrowserScreen
          career={career}
          onBack={() => setScreen('MAIN_MENU')}
        />
      )}

      {screen === 'CALENDAR_BROWSER' && (
        <SeasonCalendarView
          career={career}
          onPlayMatch={handleStartMatch}
          onSimulateMatch={handleSimulateMatch}
          onTriggerNarrativeEvent={handleTriggerNarrativeEvent}
          onAdvanceDay={handleAdvanceDay}
          onAdvanceToNextMatch={handleAdvanceToNextMatch}
          onBack={() => setScreen('MAIN_MENU')}
          onStartNewCareer={() => setScreen('CHAR_CREATOR')}
        />
      )}

      {screen === 'CUSTOMIZATION' && career && (
        <CharacterCreator
          initialCareer={career}
          editMode
          onBack={() =>
            setScreen(returnScreen === 'PLAYER_PROFILE' ? 'PLAYER_PROFILE' : 'MAIN_MENU')
          }
          onComplete={handleCustomizationSave}
        />
      )}

      {screen === 'SETTINGS' && returnScreen !== 'MATCH' && (
        <SettingsScreen
          settings={settings}
          onChange={setSettings}
          onBack={() => setScreen(returnScreen)}
        />
      )}

      {screen === 'CREDITS' && (
        <CreditsScreen onBack={() => setScreen('MAIN_MENU')} />
      )}

      {screen === 'CHAR_CREATOR' && (
        <CharacterCreator
          onBack={() => setScreen('MAIN_MENU')}
          onComplete={handleCharacterComplete}
        />
      )}

      {screen === 'CLUB_SELECT' && charDraft && (
        <ClubSelection
          playerName={charDraft.personal.nickname || charDraft.personal.firstName}
          playerOvr={calculateOverall(charDraft.attributes, charDraft.position)}
          onBack={() => setScreen('CHAR_CREATOR')}
          onSelectClub={handleClubSelected}
        />
      )}

      {screen === 'CAREER_HUB' && career && (
        <CareerHub
          career={career}
          initialTab={hubTab}
          onPlayMatch={handleStartMatch}
          onSimulateMatch={handleSimulateMatch}
          onTriggerNarrativeEvent={handleTriggerNarrativeEvent}
          onSimulateInjurySkip={handleInjurySkip}
          onAdvanceDay={handleAdvanceDay}
          onAdvanceToNextMatch={handleAdvanceToNextMatch}
          onCompleteDrill={handleCompleteDrill}
          onAcceptOffer={handleAcceptOffer}
          onOpenSettings={() => handleOpenSettings('CAREER_HUB')}
          onBackToMenu={() => setScreen('MAIN_MENU')}
        />
      )}

      {(screen === 'MATCH' || (screen === 'SETTINGS' && returnScreen === 'MATCH')) &&
        career &&
        activeFixture && (
          <>
            <MatchView
              career={career}
              homeClubId={activeFixture.homeClubId}
              awayClubId={activeFixture.awayClubId}
              competitionName={activeFixture.competitionName}
              fixtureId={activeFixture.fixtureId}
              settings={settings}
              onOpenSettings={() => handleOpenSettings('MATCH')}
              onMatchFinished={(result) => {
                const next = applyMatchOutcomeToCareer(career, result);
                setCareer(next);
                setActiveFixture(null);
                setScreen('CAREER_HUB');
              }}
              onAbandonMatch={() => {
                setActiveFixture(null);
                setScreen('CAREER_HUB');
              }}
            />
            {screen === 'SETTINGS' && returnScreen === 'MATCH' && (
              <div className="fixed inset-0 z-50">
                <SettingsScreen
                  settings={settings}
                  onChange={setSettings}
                  onBack={() => setScreen('MATCH')}
                />
              </div>
            )}
          </>
        )}
      {pendingSimReport && (
        <MatchReportModal
          report={pendingSimReport}
          onClose={() => setPendingSimReport(null)}
        />
      )}

      {pendingNarrative && (
        <NarrativeEventModal
          event={pendingNarrative.event}
          onSelectChoice={handleResolveNarrativeChoice}
          onClose={() => setPendingNarrative(null)}
        />
      )}
    </>
  );
}
