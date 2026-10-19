using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using JungleEscape.Player;
using JungleEscape.Data;

namespace JungleEscape.Core
{
    /// <summary>
    /// Intercepts unhandled Unity runtime exceptions and errors, queries the server-side
    /// self-healing endpoint (/api/error-healer/analyze), and automatically repairs game state.
    /// </summary>
    public class AutoErrorHealer : MonoBehaviour
    {
        public static AutoErrorHealer Instance { get; private set; }

        [Header("Backend Healer Endpoint")]
        [SerializeField] private string healerEndpointUrl = "/api/error-healer/analyze";
        [SerializeField] private PlayerController playerController;

        private float lastErrorTime = -10f;
        private const float ErrorCooldownSeconds = 8f;

        [Serializable]
        private class ErrorReportPayload
        {
            public string message;
            public string stack;
            public string context;
            public string gameState;
        }

        [Serializable]
        private class HealerResponse
        {
            public bool healed;
            public string diagnosis;
            public string remediationAction;
            public string fixSummary;
            public int recommendedSafeLane;
        }

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void OnEnable()
        {
            Application.logMessageReceived += HandleLogMessage;
        }

        private void OnDisable()
        {
            Application.logMessageReceived -= HandleLogMessage;
        }

        private void HandleLogMessage(string condition, string stackTrace, LogType type)
        {
            if (type != LogType.Exception && type != LogType.Error) return;
            if (Time.unscaledTime - lastErrorTime < ErrorCooldownSeconds) return;

            lastErrorTime = Time.unscaledTime;
            StartCoroutine(AnalyzeAndHealCoroutine(condition, stackTrace));
        }

        private IEnumerator AnalyzeAndHealCoroutine(string message, string stackTrace)
        {
            var payload = new ErrorReportPayload
            {
                message = message,
                stack = stackTrace,
                context = "UnityRuntimeLog",
                gameState = GameManager.Instance != null ? GameManager.Instance.CurrentState.ToString() : "Unknown"
            };

            string json = JsonUtility.ToJson(payload);
            using (var req = new UnityWebRequest(healerEndpointUrl, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
                req.uploadHandler = new UploadHandlerRaw(bodyRaw);
                req.downloadHandler = new DownloadHandlerBuffer();
                req.SetRequestHeader("Content-Type", "application/json");

                yield return req.SendWebRequest();

                if (req.result == UnityWebRequest.Result.Success)
                {
                    var response = JsonUtility.FromJson<HealerResponse>(req.downloadHandler.text);
                    if (response != null)
                    {
                        ApplyRemediation(response.remediationAction);
                    }
                }
                else
                {
                    // Local deterministic fallback
                    ApplyRemediation("CLEAR_CORRUPTED_STATE");
                }
            }
        }

        private void ApplyRemediation(string action)
        {
            switch (action)
            {
                case "RESET_SAVE_SCHEMA":
                    SaveManager.Instance?.LoadSave();
                    break;
                case "RECOVER_PLAYER_POSITION":
                    playerController?.ResetPosition();
                    break;
                case "CLEAR_CORRUPTED_STATE":
                    playerController?.ResetPosition();
                    Time.timeScale = 1f;
                    break;
            }
        }
    }
}
