using System;

namespace JungleEscape.Data
{
    [Serializable]
    public class SaveData
    {
        public int highScore = 0;
        public int bestDistance = 0;
        public int totalCoins = 0;
        public string selectedCharacter = "lara";
        public float musicVolume = 0.8f;
        public float sfxVolume = 0.8f;
        public bool isMuted = false;
        public int shieldLevel = 1;
        public int magnetLevel = 1;
        public int boostLevel = 1;
    }
}
