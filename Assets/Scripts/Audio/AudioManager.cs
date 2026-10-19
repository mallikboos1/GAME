using UnityEngine;

namespace JungleEscape.Audio
{
    public class AudioManager : MonoBehaviour
    {
        public static AudioManager Instance { get; private set; }

        [SerializeField] private AudioSource sfxSource;
        [SerializeField] private AudioSource musicSource;

        [SerializeField] private AudioClip jumpClip;
        [SerializeField] private AudioClip slideClip;
        [SerializeField] private AudioClip coinClip;
        [SerializeField] private AudioClip crashClip;
        [SerializeField] private AudioClip powerUpClip;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void PlayJump() => PlaySfx(jumpClip);
        public void PlaySlide() => PlaySfx(slideClip);
        public void PlayCoin() => PlaySfx(coinClip);
        public void PlayCrash() => PlaySfx(crashClip);
        public void PlayPowerUp() => PlaySfx(powerUpClip);

        private void PlaySfx(AudioClip clip)
        {
            if (clip != null && sfxSource != null)
            {
                sfxSource.PlayOneShot(clip);
            }
        }
    }
}
