using System.Collections.Generic;
using UnityEngine;

namespace JungleEscape.Optimization
{
    /// <summary>
    /// Generic Object Pool to eliminate runtime GC allocations for coins, obstacles, and segments.
    /// </summary>
    public class ObjectPoolManager : MonoBehaviour
    {
        public static ObjectPoolManager Instance { get; private set; }

        private Dictionary<string, Queue<GameObject>> poolDict = new Dictionary<string, Queue<GameObject>>();

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        public void Prewarm(string poolKey, GameObject prefab, int count, Transform parent = null)
        {
            if (!poolDict.ContainsKey(poolKey))
            {
                poolDict[poolKey] = new Queue<GameObject>();
            }

            for (int i = 0; i < count; i++)
            {
                GameObject obj = Instantiate(prefab, parent);
                obj.SetActive(false);
                poolDict[poolKey].Enqueue(obj);
            }
        }

        public GameObject Spawn(string poolKey, Vector3 position, Quaternion rotation)
        {
            if (poolDict.ContainsKey(poolKey) && poolDict[poolKey].Count > 0)
            {
                GameObject obj = poolDict[poolKey].Dequeue();
                obj.transform.position = position;
                obj.transform.rotation = rotation;
                obj.SetActive(true);
                return obj;
            }

            return null;
        }

        public void ReturnToPool(string poolKey, GameObject obj)
        {
            obj.SetActive(false);
            if (!poolDict.ContainsKey(poolKey))
            {
                poolDict[poolKey] = new Queue<GameObject>();
            }
            poolDict[poolKey].Enqueue(obj);
        }
    }
}
