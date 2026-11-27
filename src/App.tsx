import { useCallback, useEffect, useState } from "react";
import CameraView from "./components/CameraView";
import StartScreen from "./components/StartScreen";
import Topbar from "./components/Topbar";
import { useSound } from "./hooks/useSound";
import { BOOTH_TEMPLATES } from "./utils/boothTemplates";
import "./App.css";

type Screen = "start" | "booth";

function readSoundPreference() {
  try {
    return window.localStorage.getItem("handtime:sound") !== "off";
  } catch {
    return true;
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [templateId, setTemplateId] = useState(BOOTH_TEMPLATES[0].id);
  const [soundOn, setSoundOn] = useState(readSoundPreference);

  const { prime, playTick, playGo, playShutter } = useSound(soundOn);

  useEffect(() => {
    try {
      window.localStorage.setItem("handtime:sound", soundOn ? "on" : "off");
    } catch {
      // Storage can be blocked; the toggle still works for this session.
    }
  }, [soundOn]);

  const handleStart = useCallback(() => {
    // Unlock audio inside the click, before the booth mounts.
    prime();
    setScreen("booth");
  }, [prime]);

  const handleExit = useCallback(() => {
    setScreen("start");
  }, []);

  const toggleSound = useCallback(() => {
    if (!soundOn) prime();
    setSoundOn((current) => !current);
  }, [soundOn, prime]);

  return (
    <div className="app">
      <Topbar
        onBrandClick={screen === "booth" ? handleExit : undefined}
        sound={
          screen === "booth"
            ? { on: soundOn, onToggle: toggleSound }
            : undefined
        }
      />

      {screen === "start" ? (
        <StartScreen
          onStart={handleStart}
          templateId={templateId}
          onTemplateChange={setTemplateId}
        />
      ) : (
        <CameraView
          sound={{ playTick, playGo, playShutter }}
          templateId={templateId}
          onTemplateChange={setTemplateId}
        />
      )}
    </div>
  );
}
