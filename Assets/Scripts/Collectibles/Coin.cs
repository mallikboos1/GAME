using UnityEngine;

namespace JungleEscape.Collectibles
{
    /// <summary>
    /// Aztec gold coin with rotation and magnetic pull response.
    /// </summary>
    public class Coin : MonoBehaviour
    {
        [SerializeField] private float rotationSpeed = 180f;
        [SerializeField] private int coinValue = 1;

        public bool IsCollected { get; private set; } = false;

        private void Update()
        {
            transform.Rotate(0, rotationSpeed * Time.deltaTime, 0);
        }

        public void AttractTowards(Vector3 targetPos, float speed)
        {
            transform.position = Vector3.MoveTowards(transform.position, targetPos, speed * Time.deltaTime);
        }

        private void OnTriggerEnter(Collider other)
        {
            if (IsCollected) return;

            if (other.CompareTag("Player"))
            {
                IsCollected = true;
                CoinManager.Instance?.CollectCoin(coinValue);
                gameObject.SetActive(false);
            }
        }

        public void ResetCoin()
        {
            IsCollected = false;
            gameObject.SetActive(true);
        }
    }
}
