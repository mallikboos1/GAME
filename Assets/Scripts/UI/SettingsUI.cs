using UnityEngine;
using UnityEngine.UI;
using JungleEscape.Data;

namespace JungleEscape.UI
{
    public class SettingsUI : MonoBehaviour
    {
        [SerializeField] private Slider musicSlider;
        [SerializeField] private Slider sfxSlider;
        [SerializeField] private Toggle muteToggle;

        private void Start()
        {
            var save = SaveManager.Instance?.CurrentSave;
            if (save != null)
            {
                if (musicSlider) musicSlider.value = save.musicVolume;
                if (sfxSlider) sfxSlider.value = save.sfxVolume;
                if (muteToggle) muteToggle.isOn = save.isMuted;
            }

            musicSlider?.onValueChanged.AddListener((val) => SaveManager.Instance?.UpdateMusicVolume(val));
            sfxSlider?.onValueChanged.AddListener((val) => SaveManager.Instance?.UpdateSfxVolume(val));
            muteToggle?.onValueChanged.AddListener((val) => SaveManager.Instance?.SetMuted(val));
        }
    }
}
