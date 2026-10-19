using System;
using UnityEngine;
using JungleEscape.Core;

namespace JungleEscape.PowerUps
{
    public enum PowerUpType
    {
        Shield,
        CoinMagnet,
        SpeedBoost
    }

    /// <summary>
    /// Manages active power-ups, timers, and notifies HUD.
    /// </summary>
    public class PowerUpManager : MonoBehaviour
    {
        public static PowerUpManager Instance { get; private set; }

        public bool IsShieldActive => shieldTimer > 0;
        public bool IsMagnetActive => magnetTimer > 0;
        public bool IsSpeedBoostActive => boostTimer > 0;

        public event Action<PowerUpType, float, float> OnPowerUpActivated;
        public event Action<PowerUpType> OnPowerUpExpired;

        private float shieldTimer = 0f;
        private float magnetTimer = 0f;
        private float boostTimer = 0f;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Update()
        {
            if (GameManager.Instance.CurrentState != GameState.Playing) return;

            if (shieldTimer > 0)
            {
                shieldTimer -= Time.deltaTime;
                if (shieldTimer <= 0) OnPowerUpExpired?.Invoke(PowerUpType.Shield);
            }

            if (magnetTimer > 0)
            {
                magnetTimer -= Time.deltaTime;
                if (magnetTimer <= 0) OnPowerUpExpired?.Invoke(PowerUpType.CoinMagnet);
            }

            if (boostTimer > 0)
            {
                boostTimer -= Time.deltaTime;
                if (boostTimer <= 0) OnPowerUpExpired?.Invoke(PowerUpType.SpeedBoost);
            }
        }

        public void ActivatePowerUp(PowerUpType type, float duration)
        {
            switch (type)
            {
                case PowerUpType.Shield:
                    shieldTimer = duration;
                    break;
                case PowerUpType.CoinMagnet:
                    magnetTimer = duration;
                    break;
                case PowerUpType.SpeedBoost:
                    boostTimer = duration;
                    break;
            }
            OnPowerUpActivated?.Invoke(type, duration, duration);
        }

        public void ConsumeShield()
        {
            shieldTimer = 0f;
            OnPowerUpExpired?.Invoke(PowerUpType.Shield);
        }
    }
}
