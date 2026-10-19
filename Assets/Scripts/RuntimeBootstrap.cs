using UnityEngine;
using JungleEscape.Core;
using JungleEscape.Player;
using JungleEscape.World;
using JungleEscape.Collectibles;
using JungleEscape.Gameplay;
using JungleEscape.PowerUps;
using JungleEscape.Data;
using JungleEscape.Camera;

namespace JungleEscape
{
    /// <summary>
    /// Procedural runtime bootstrapper. Constructs an operational 3D Endless Runner scene
    /// in Unity if opened from an empty scene.
    /// </summary>
    public static class RuntimeBootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        public static void InitializeSceneIfEmpty()
        {
            if (Object.FindAnyObjectByType<GameManager>() != null) return;

            Debug.Log("[Jungle Escape 3D] Initializing procedural scene bootstrap...");

            // 1. Core Managers
            GameObject managersObj = new GameObject("--- GAME MANAGERS ---");
            managersObj.AddComponent<GameManager>();
            managersObj.AddComponent<SaveManager>();
            managersObj.AddComponent<CoinManager>();
            managersObj.AddComponent<ScoreManager>();
            managersObj.AddComponent<PowerUpManager>();

            // 2. Main Directional Sun Light
            GameObject lightObj = new GameObject("Jungle Sun Light");
            Light light = lightObj.AddComponent<Light>();
            light.type = LightType.Directional;
            light.color = new Color(1f, 0.93f, 0.84f);
            light.intensity = 1.6f;
            light.shadows = LightShadows.Soft;
            lightObj.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

            // 3. Player Character
            GameObject playerObj = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            playerObj.name = "Player_Explorer";
            playerObj.tag = "Player";
            playerObj.transform.position = new Vector3(0, 1f, 0);

            CharacterController cc = playerObj.AddComponent<CharacterController>();
            playerObj.AddComponent<PlayerInputHandler>();
            playerObj.AddComponent<PlayerController>();
            playerObj.AddComponent<PlayerCollision>();

            // 4. Follow Camera
            UnityEngine.Camera cam = UnityEngine.Camera.main;
            if (cam == null)
            {
                GameObject camObj = new GameObject("Main Camera");
                cam = camObj.AddComponent<UnityEngine.Camera>();
                camObj.tag = "MainCamera";
            }
            CameraFollow follow = cam.gameObject.AddComponent<CameraFollow>();

            // 5. World Track Root
            GameObject worldObj = new GameObject("TrackManager");
            worldObj.AddComponent<TrackManager>();

            Debug.Log("[Jungle Escape 3D] Scene successfully bootstrapped and ready to play!");
        }
    }
}
