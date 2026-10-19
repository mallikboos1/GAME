using UnityEngine;

namespace JungleEscape.Camera
{
    /// <summary>
    /// Smooth third-person camera follower.
    /// </summary>
    public class CameraFollow : MonoBehaviour
    {
        [SerializeField] private Transform target;
        [SerializeField] private Vector3 offset = new Vector3(0, 3.8f, -5.8f);
        [SerializeField] private float smoothSpeed = 10f;

        private void LateUpdate()
        {
            if (target == null) return;

            Vector3 desiredPosition = new Vector3(
                Mathf.Lerp(transform.position.x, target.position.x * 0.75f, Time.deltaTime * smoothSpeed),
                target.position.y + offset.y,
                target.position.z + offset.z
            );

            transform.position = desiredPosition;
            transform.LookAt(new Vector3(target.position.x * 0.4f, 1.4f, target.position.z + 6f));
        }
    }
}
