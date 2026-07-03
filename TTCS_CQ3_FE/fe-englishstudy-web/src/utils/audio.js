export const playAudio = (word) => {
  if (!word) return;

  try {
    
    const audio = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(word)}&tl=en&client=tw-ob`);
    
    audio.play().catch(err => {
      console.warn("Google TTS failed, falling back to Web Speech API:", err);
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    });
  } catch (error) {
    console.error("Audio playback error:", error);
  }
};