using System;
using UnityEngine;

namespace JungleEscape.Player
{
    /// <summary>
    /// Captures touch swipe gestures and keyboard inputs for PC/mobile cross-play.
    /// </summary>
    public class PlayerInputHandler : MonoBehaviour
    {
        public event Action OnSwipeLeft;
        public event Action OnSwipeRight;
        public event Action OnSwipeUp;
        public event Action OnSwipeDown;

        [SerializeField] private float minSwipeDistance = 35f;

        private Vector2 touchStartPos;
        private bool isSwiping = false;

        private void Update()
        {
            HandleKeyboardInput();
            HandleTouchInput();
        }

        private void HandleKeyboardInput()
        {
            if (Input.GetKeyDown(KeyCode.A) || Input.GetKeyDown(KeyCode.LeftArrow))
            {
                OnSwipeLeft?.Invoke();
            }
            else if (Input.GetKeyDown(KeyCode.D) || Input.GetKeyDown(KeyCode.RightArrow))
            {
                OnSwipeRight?.Invoke();
            }
            else if (Input.GetKeyDown(KeyCode.W) || Input.GetKeyDown(KeyCode.UpArrow) || Input.GetKeyDown(KeyCode.Space))
            {
                OnSwipeUp?.Invoke();
            }
            else if (Input.GetKeyDown(KeyCode.S) || Input.GetKeyDown(KeyCode.DownArrow))
            {
                OnSwipeDown?.Invoke();
            }
        }

        private void HandleTouchInput()
        {
            if (Input.touchCount == 0) return;

            Touch touch = Input.GetTouch(0);

            switch (touch.phase)
            {
                case TouchPhase.Began:
                    touchStartPos = touch.position;
                    isSwiping = true;
                    break;

                case TouchPhase.Ended:
                    if (!isSwiping) return;

                    Vector2 delta = touch.position - touchStartPos;
                    if (delta.magnitude >= minSwipeDistance)
                    {
                        if (Mathf.Abs(delta.x) > Mathf.Abs(delta.y))
                        {
                            if (delta.x > 0) OnSwipeRight?.Invoke();
                            else OnSwipeLeft?.Invoke();
                        }
                        else
                        {
                            if (delta.y > 0) OnSwipeUp?.Invoke();
                            else OnSwipeDown?.Invoke();
                        }
                    }
                    isSwiping = false;
                    break;
            }
        }
    }
}
