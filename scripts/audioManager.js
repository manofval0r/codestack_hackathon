// A map of sound names to their corresponding Audio objects.
const sounds = {
    loading: new Audio('https://pixabay.com/sound-effects/keyboard-typing-loop-2-400953/    '),
    success: new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_755cf0bff2.mp3'),
    fail: new Audio('https://cdn.pixabay.com/download/audio/2022/03/03/audio_b28a8a927a.mp3'),
    click: new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_c848a87a2a.mp3'),
    achievement: new Audio('https://cdn.pixabay.com/download/audio/2022/05/23/audio_34b684e727.mp3'),
    hint: new Audio('https://cdn.pixabay.com/download/audio/2022/02/02/audio_03d9f049a1.mp3'),
};

// Set volumes to be less intrusive
sounds.loading.volume = 0.5;
sounds.loading.loop = true; // The typing sound should loop
sounds.click.volume = 0.7;

export class AudioManager {
    /**
     * Plays a sound from our preloaded library.
     * @param {string} soundName - The name of the sound to play (e.g., 'success', 'fail').
     */
    play(soundName) {
        if (sounds[soundName]) {
            // Reset the sound to the beginning before playing
            sounds[soundName].currentTime = 0;
            sounds[soundName].play();
        }
    }

    /**
     * Stops a sound. Useful for looping sounds.
     * @param {string} soundName - The name of the sound to stop.
     */
    stop(soundName) {
        if (sounds[soundName]) {
            sounds[soundName].pause();
            sounds[soundName].currentTime = 0;
        }
    }
}