using UnityEngine;

namespace JungleEscape.PowerUps
{
    public class CoinMagnetPowerUp : MonoBehaviour
    {
        [SerializeField] private float duration = 10f;

        private void OnTriggerEnter(Collider other)
        {
            if (other.CompareTag("Player"))
            {
                PowerUpManager.Instance?.ActivatePowerUp(PowerUpType.CoinMagnet, duration);
                gameObject.SetActive(false);
            }
        }
    }
}
