using System.Collections.Generic;
using UnityEngine;
using JungleEscape.Player;

namespace JungleEscape.World
{
    /// <summary>
    /// Endless track streamer recycling segments and managing spawn queues.
    /// </summary>
    public class TrackManager : MonoBehaviour
    {
        [SerializeField] private TrackSegment[] segmentPrefabs;
        [SerializeField] private int initialSegments = 8;
        [SerializeField] private float segmentLength = 24f;
        [SerializeField] private Transform playerTransform;

        private Queue<TrackSegment> activeSegments = new Queue<TrackSegment>();
        private float spawnZ = 0f;

        private void Start()
        {
            ResetTrack();
        }

        private void Update()
        {
            if (playerTransform == null) return;

            if (activeSegments.Count > 0)
            {
                TrackSegment first = activeSegments.Peek();
                if (playerTransform.position.z - first.transform.position.z > segmentLength + 10f)
                {
                    RecycleSegment();
                }
            }
        }

        public void ResetTrack()
        {
            foreach (var seg in activeSegments)
            {
                Destroy(seg.gameObject);
            }
            activeSegments.Clear();
            spawnZ = 0f;

            for (int i = 0; i < initialSegments; i++)
            {
                SpawnSegment(i >= 2);
            }
        }

        private void SpawnSegment(bool withObstacles)
        {
            if (segmentPrefabs == null || segmentPrefabs.Length == 0) return;

            int randomIndex = Random.Range(0, segmentPrefabs.Length);
            TrackSegment segment = Instantiate(segmentPrefabs[randomIndex], transform);
            segment.transform.position = new Vector3(0, 0, spawnZ);

            if (!withObstacles)
            {
                segment.ClearSpawnedItems();
            }

            activeSegments.Enqueue(segment);
            spawnZ += segmentLength;
        }

        private void RecycleSegment()
        {
            TrackSegment oldSeg = activeSegments.Dequeue();
            oldSeg.transform.position = new Vector3(0, 0, spawnZ);
            oldSeg.ClearSpawnedItems();
            activeSegments.Enqueue(oldSeg);
            spawnZ += segmentLength;
        }
    }
}
