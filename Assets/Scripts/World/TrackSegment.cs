using UnityEngine;

namespace JungleEscape.World
{
    /// <summary>
    /// Represents a single pooled track tile segment.
    /// </summary>
    public class TrackSegment : MonoBehaviour
    {
        [SerializeField] private float segmentLength = 24f;
        public float SegmentLength => segmentLength;

        [SerializeField] private Transform[] obstacleSpawnPoints;
        [SerializeField] private Transform[] coinSpawnPoints;

        public void ClearSpawnedItems()
        {
            foreach (Transform child in transform)
            {
                if (child.CompareTag("Obstacle") || child.CompareTag("Coin") || child.CompareTag("PowerUp"))
                {
                    child.gameObject.SetActive(false);
                }
            }
        }
    }
}
