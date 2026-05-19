/**
 * Professional synthetic Web Audio notification sound generator.
 * Zero external asset dependencies, zero network latency, bulletproof reliability.
 */
export const playNotificationSound = (type: 'signup' | 'payment') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'signup') {
      // Gentle, bright rising sine chime: C5 -> E5 -> G5
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        
        gainNode.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
      });
    } else if (type === 'payment') {
      // Metallic coin cash register "Cha-Ching!" sound 💸
      const strikeTime = ctx.currentTime;
      
      // High bright metallic pitch (Triangle Wave)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1500, strikeTime);
      gain1.gain.setValueAtTime(0.18, strikeTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.7);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(strikeTime);
      osc1.stop(strikeTime + 0.7);

      // Sweet harmony sine pitch
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1200, strikeTime + 0.06);
      gain2.gain.setValueAtTime(0.15, strikeTime + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.06 + 0.5);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(strikeTime + 0.06);
      osc2.stop(strikeTime + 0.06 + 0.5);

      // High-pass filtered cash register sawtooth click (simulates metallic coin rattle)
      const noise = ctx.createOscillator();
      noise.type = 'sawtooth';
      noise.frequency.value = 3200;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1200;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.04, strikeTime + 0.08);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.08 + 0.2);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(strikeTime + 0.08);
      noise.stop(strikeTime + 0.08 + 0.22);
    }
  } catch (error) {
    console.warn('Web Audio synthesis failed:', error);
  }
};
