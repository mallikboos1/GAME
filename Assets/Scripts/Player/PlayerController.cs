using UnityEngine;
using JungleEscape.Core;

namespace JungleEscape.Player
{
    /// <summary>
    /// Kinematic 3-lane controller with jump and slide state transitions.
    /// </summary>
    [RequireComponent(typeof(CharacterController))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Movement Settings")]
        [SerializeField] private float laneDistance = 2.5f;
        [SerializeField] private float laneSwitchSpeed = 15f;
        [SerializeField] private float baseForwardSpeed = 16f;
        [SerializeField] private float maxForwardSpeed = 32f;

        [Header("Jump & Slide")]
        [SerializeField] private float jumpForce = 8.5f;
        [SerializeField] private float gravity = 24f;
        [SerializeField] private float slideDuration = 0.75f;

        [Header("Input Handler")]
        [SerializeField] private PlayerInputHandler inputHandler;

        private CharacterController characterController;
        private int currentLane = 0; // -1 = Left, 0 = Center, 1 = Right
        private float verticalVelocity = 0f;
        private float forwardSpeed;
        private bool isSliding = false;
        private float slideTimer = 0f;
        private Vector3 originalCenter;
        private float originalHeight;

        public float ForwardSpeed => forwardSpeed;
        public bool IsSliding => isSliding;
        public bool IsJumping => !characterController.isGrounded;

        private void Awake()
        {
            characterController = GetComponent<CharacterController>();
            originalCenter = characterController.center;
            originalHeight = characterController.height;
            forwardSpeed = baseForwardSpeed;
        }

        private void OnEnable()
        {
            if (inputHandler != null)
            {
                inputHandler.OnSwipeLeft += MoveLeft;
                inputHandler.OnSwipeRight += MoveRight;
                inputHandler.OnSwipeUp += Jump;
                inputHandler.OnSwipeDown += Slide;
            }
        }

        private void OnDisable()
        {
            if (inputHandler != null)
            {
                inputHandler.OnSwipeLeft -= MoveLeft;
                inputHandler.OnSwipeRight -= MoveRight;
                inputHandler.OnSwipeUp -= Jump;
                inputHandler.OnSwipeDown -= Slide;
            }
        }

        private void Update()
        {
            if (GameManager.Instance.CurrentState != GameState.Playing) return;

            // Lateral target interpolation
            float targetX = currentLane * laneDistance;
            float currentX = transform.position.x;
            float newX = Mathf.MoveTowards(currentX, targetX, laneSwitchSpeed * Time.deltaTime);

            // Gravity & Vertical motion
            if (characterController.isGrounded)
            {
                if (verticalVelocity < 0) verticalVelocity = -1f;
            }
            else
            {
                verticalVelocity -= gravity * Time.deltaTime;
            }

            // Slide duration handling
            if (isSliding)
            {
                slideTimer -= Time.deltaTime;
                if (slideTimer <= 0)
                {
                    EndSlide();
                }
            }

            // Apply movement vector
            Vector3 move = new Vector3(newX - currentX, verticalVelocity * Time.deltaTime, forwardSpeed * Time.deltaTime);
            characterController.Move(move);
        }

        public void MoveLeft()
        {
            if (currentLane > -1) currentLane--;
        }

        public void MoveRight()
        {
            if (currentLane < 1) currentLane++;
        }

        public void Jump()
        {
            if (characterController.isGrounded)
            {
                verticalVelocity = jumpForce;
                if (isSliding) EndSlide();
            }
        }

        public void Slide()
        {
            if (!characterController.isGrounded)
            {
                verticalVelocity = -14f; // Fast drop mechanic
            }

            isSliding = true;
            slideTimer = slideDuration;
            characterController.height = originalHeight * 0.5f;
            characterController.center = new Vector3(originalCenter.x, originalCenter.y * 0.5f, originalCenter.z);
        }

        private void EndSlide()
        {
            isSliding = false;
            characterController.height = originalHeight;
            characterController.center = originalCenter;
        }

        public void SetSpeed(float newSpeed)
        {
            forwardSpeed = Mathf.Clamp(newSpeed, baseForwardSpeed, maxForwardSpeed);
        }

        public void ResetPosition()
        {
            currentLane = 0;
            verticalVelocity = 0f;
            forwardSpeed = baseForwardSpeed;
            EndSlide();
            transform.position = Vector3.zero;
        }
    }
}
