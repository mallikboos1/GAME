using UnityEngine;

namespace JungleEscape.World
{
    /// <summary>
    /// Spawns obstacles ensuring at least one lane is safe.
    /// </summary>
    public class ObstacleSpawner : MonoBehaviour
    {
        [SerializeField] private GameObject[] lowHurdlePrefabs;
        [SerializeField] private GameObject[] highArchPrefabs;
        [SerializeField] private GameObject[] laneTotemPrefabs;

        public void PopulateLaneObstacles(Transform parentSegment, float zOffset)
        {
            // Pick a safe lane (0, -1, 1)
            int safeLane = Random.Range(-1, 2);

            for (int lane = -1; lane <= 1; lane++)
            {
                if (lane == safeLane) continue;

                if (Random.value > 0.4f && laneTotemPrefabs.Length > 0)
                {
                    GameObject prefab = laneTotemPrefabs[Random.Range(0, laneTotemPrefabs.Length)];
                    GameObject obs = Instantiate(prefab, parentSegment);
                    obs.transform.localPosition = new Vector3(lane * 2.5f, 0, zOffset);
                }
            }
        }
    }
}
