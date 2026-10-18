// Match presentation uses the approved catalogue without changing its review history.
export function pickFeedbackVoice(audio, characterId, event, opponentId = null) {
  // A victory needs its own recording. Missing recordings remain missing,
  // instead of disguising a hit taunt as a victory line.
  return {clip: audio.pickVoice(characterId, event, opponentId), sourceEvent: event};
}

export async function presentVoiceFeedback(audio, {
  characterId, event = 'hit', opponentId = null, selectedClip = null,
  isCurrent = () => true, show = () => {}
}) {
  try {
    if (!isCurrent()) return false;
    await (audio.readyVoices ? audio.readyVoices() : audio.voiceManifest);
    if (!isCurrent()) return false;
    const selectedEvents = selectedClip?.events || [selectedClip?.event];
    const selectedAllowed = selectedEvents.includes(event) && (!selectedEvents.includes('win') || (event === 'win' && selectedEvents.length === 1));
    const {clip} = selectedClip ? {clip: selectedAllowed ? selectedClip : null} : pickFeedbackVoice(audio, characterId, event, opponentId);
    if (!clip) {
      if (event !== 'special') show(null);
      return false;
    }
    if (audio.enabled === false || audio.voiceVolume === 0) {
      show(clip);
      return false;
    }
    let shown = false;
    const onStart = () => {
      if (!isCurrent() || shown) return;
      shown = true;
      show(clip);
    };
    const played = await audio.playVoice(clip, false, event === 'win' ? 3 : 1, {
      shouldPlay: isCurrent, onStart
    });
    if (played) onStart();
    return played;
  } catch {
    return false;
  }
}
