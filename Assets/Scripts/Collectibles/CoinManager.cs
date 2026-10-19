using System;
using UnityEngine;

namespace JungleEscape.Collectibles
{
    /// <summary>
    /// Tracks coins collected during current run and dispatches events.
    /// </summary>
    public class CoinManager : MonoBehaviour
    {
        public static CoinManager Instance { get; private set; }

        public int RunCoins { get; private set; } = 0;
        public event Action<int> OnCoinsChanged;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public void ResetRun()
        {
            RunCoins = 0;
            OnCoinsChanged?.Invoke(RunCoins);
        }

        public void CollectCoin(int amount)
        {
            RunCoins += amount;
            OnCoinsChanged?.Invoke(RunCoins);
        }
    }
}
