using UnityEngine;

namespace JungleEscape.Data
{
    /// <summary>
    /// Local persistence manager serializing save data via PlayerPrefs.
    /// </summary>
    public class SaveManager : MonoBehaviour
    {
        public static SaveManager Instance { get; private set; }

        private const string SAVE_KEY = "JungleEscape_SaveData_v1";
        public SaveData CurrentSave { get; private set; }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
            LoadSave();
        }

        public void LoadSave()
        {
            if (PlayerPrefs.HasKey(SAVE_KEY))
            {
                string json = PlayerPrefs.GetString(SAVE_KEY);
                CurrentSave = JsonUtility.FromJson<SaveData>(json);
            }
            else
            {
                CurrentSave = new SaveData();
                Save();
            }
        }

        public void Save()
        {
            if (CurrentSave != null)
            {
                string json = JsonUtility.ToJson(CurrentSave);
                PlayerPrefs.SetString(SAVE_KEY, json);
                PlayerPrefs.Save();
            }
        }

        public void RecordCompletedRun(int score, int distance, int coins)
        {
            if (CurrentSave == null) return;

            if (score > CurrentSave.highScore)
            {
                CurrentSave.highScore = score;
            }

            if (distance > CurrentSave.bestDistance)
            {
                CurrentSave.bestDistance = distance;
            }

            CurrentSave.totalCoins += coins;
            Save();
        }

        public void UpdateMusicVolume(float vol)
        {
            if (CurrentSave != null)
            {
                CurrentSave.musicVolume = vol;
                Save();
            }
        }

        public void UpdateSfxVolume(float vol)
        {
            if (CurrentSave != null)
            {
                CurrentSave.sfxVolume = vol;
                Save();
            }
        }

        public void SetMuted(bool muted)
        {
            if (CurrentSave != null)
            {
                CurrentSave.isMuted = muted;
                Save();
            }
        }
    }
}
