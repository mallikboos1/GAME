using UnityEngine;

namespace JungleEscape.PowerUps
{
    public class ShieldPowerUp : MonoBehaviour
    {
        [SerializeField] private float duration = 12f;

        private void OnTriggerEnter(Collider other)
        {
            if (other.CompareTag("Player"))
            {
                PowerUpManager.Instance?.ActivatePowerUp(PowerUpType.Shield, duration);
                gameObject.SetActive(false);
            }
        }
    }
}
