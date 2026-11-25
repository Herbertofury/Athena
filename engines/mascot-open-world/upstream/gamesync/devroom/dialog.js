/* ═══════════════════════════════════════════════════════════════════════════
   Dev Room — Dialog
   NPC dialog, conversation trees, speech bubbles, branching choices.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const DR = window.__gsDevRoom = window.__gsDevRoom || {};
  if (DR.Dialog) return;

  const DEFAULTS = Object.freeze({
    /* Characters per second for typewriter effect */
    typewriterSpeed: 40,
    /* Whether to use typewriter effect */
    enableTypewriter: true,
    /* Time to show a line before auto-advance (0 = manual advance only) */
    autoAdvanceDelay: 0,
    /* Maximum characters per line before wrapping */
    lineWidth: 40,
    /* Speech bubble display duration (seconds) */
    bubbleDuration: 3,
    /* Max choices per dialog branch */
    maxChoices: 4,
  });

  const Dialog = {
    DEFAULTS,

    create(userConfig = {}) {
      const cfg = { ...DEFAULTS, ...userConfig };

      return {
        config: cfg,

        /**
         * Define a conversation tree.
         * @param {Object} tree — { start: "node_id", nodes: { node_id: { ... } } }
         *
         * Node format:
         *   { speaker, text, choices: [{ text, next }], next, onEnter, onExit, condition }
         */
        createConversation(tree) {
          const nodes = tree.nodes || {};
          const startId = tree.start || Object.keys(nodes)[0] || "";

          const state = {
            currentNode: "",
            charIndex: 0,
            elapsed: 0,
            finished: false,
            waitingForChoice: false,
            selectedChoice: -1,
            history: [],
          };

          return {
            nodes,
            state,

            /** Start or restart the conversation */
            start() {
              state.currentNode = startId;
              state.charIndex = 0;
              state.elapsed = 0;
              state.finished = false;
              state.waitingForChoice = false;
              state.selectedChoice = -1;
              state.history = [];
              const node = nodes[startId];
              if (node && node.onEnter) node.onEnter();
            },

            /** Get current dialog node */
            getCurrentNode() {
              return nodes[state.currentNode] || null;
            },

            /** Get displayed text (with typewriter) */
            getDisplayText() {
              const node = this.getCurrentNode();
              if (!node) return "";
              if (!cfg.enableTypewriter) return node.text || "";
              return (node.text || "").substring(0, state.charIndex);
            },

            /** Check if current text is fully revealed */
            isTextComplete() {
              const node = this.getCurrentNode();
              if (!node) return true;
              return state.charIndex >= (node.text || "").length;
            },

            /** Update typewriter effect and timers */
            update(dt) {
              if (state.finished) return;

              const node = this.getCurrentNode();
              if (!node) { state.finished = true; return; }

              /* Typewriter */
              if (cfg.enableTypewriter && state.charIndex < (node.text || "").length) {
                state.elapsed += dt;
                state.charIndex = Math.min(
                  Math.floor(state.elapsed * cfg.typewriterSpeed),
                  (node.text || "").length
                );
              }

              /* Auto advance */
              if (this.isTextComplete() && cfg.autoAdvanceDelay > 0 && !node.choices?.length) {
                state.elapsed += dt;
                if (state.elapsed >= cfg.autoAdvanceDelay + (node.text || "").length / cfg.typewriterSpeed) {
                  this.advance();
                }
              }
            },

            /** Skip typewriter — show full text */
            skipTypewriter() {
              const node = this.getCurrentNode();
              if (node) state.charIndex = (node.text || "").length;
            },

            /** Advance to next node or present choices */
            advance(choiceIndex) {
              const node = this.getCurrentNode();
              if (!node) { state.finished = true; return; }

              if (node.onExit) node.onExit();
              state.history.push(state.currentNode);

              /* Choices */
              if (node.choices && node.choices.length > 0) {
                if (choiceIndex == null) {
                  state.waitingForChoice = true;
                  return;
                }
                const choice = node.choices[choiceIndex];
                if (!choice) return;
                state.waitingForChoice = false;
                state.currentNode = choice.next || "";
              } else {
                state.currentNode = node.next || "";
              }

              /* Next node */
              if (!state.currentNode || !nodes[state.currentNode]) {
                state.finished = true;
                return;
              }

              const next = nodes[state.currentNode];

              /* Condition check — skip node if condition fails */
              if (next.condition && !next.condition()) {
                state.currentNode = next.next || "";
                if (!state.currentNode || !nodes[state.currentNode]) {
                  state.finished = true;
                }
                return;
              }

              state.charIndex = 0;
              state.elapsed = 0;
              if (next.onEnter) next.onEnter();
            },

            /** Get available choices for current node */
            getChoices() {
              const node = this.getCurrentNode();
              if (!node || !node.choices) return [];
              return node.choices.map((c, i) => ({
                index: i,
                text: c.text || "",
                available: c.condition ? c.condition() : true,
              }));
            },

            /** Check if conversation is finished */
            isFinished() { return state.finished; },

            /** Get conversation history (visited node IDs) */
            getHistory() { return [...state.history]; },
          };
        },

        /**
         * Create a floating speech bubble.
         * @param {string} text
         * @param {Object} options — { duration, speaker, position }
         * @returns {Object} bubble state
         */
        createBubble(text, options = {}) {
          return {
            text,
            speaker: options.speaker || "",
            duration: options.duration ?? cfg.bubbleDuration,
            elapsed: 0,
            x: options.x ?? 0,
            y: options.y ?? 0,
            active: true,
          };
        },

        /** Update a speech bubble timer */
        updateBubble(bubble, dt) {
          if (!bubble.active) return;
          bubble.elapsed += dt;
          if (bubble.elapsed >= bubble.duration) {
            bubble.active = false;
          }
        },

        /** Render a speech bubble to Canvas2D */
        renderBubble(ctx, bubble, screenX, screenY) {
          if (!bubble.active) return;

          const padding = 8;
          const fontSize = 12;
          ctx.font = `${fontSize}px 'Segoe UI', system-ui, sans-serif`;
          const metrics = ctx.measureText(bubble.text);
          const bw = metrics.width + padding * 2;
          const bh = fontSize + padding * 2;
          const bx = screenX - bw / 2;
          const by = screenY - bh - 12;

          /* Fade out near end */
          const fadeStart = bubble.duration * 0.75;
          const alpha = bubble.elapsed > fadeStart
            ? Math.max(0, 1 - (bubble.elapsed - fadeStart) / (bubble.duration - fadeStart))
            : 1;

          ctx.save();
          ctx.globalAlpha = alpha;

          /* Bubble background */
          ctx.fillStyle = "rgba(10, 10, 20, 0.85)";
          ctx.beginPath();
          ctx.moveTo(bx + 6, by);
          ctx.lineTo(bx + bw - 6, by);
          ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + 6);
          ctx.lineTo(bx + bw, by + bh - 6);
          ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - 6, by + bh);
          ctx.lineTo(bx + 6, by + bh);
          ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - 6);
          ctx.lineTo(bx, by + 6);
          ctx.quadraticCurveTo(bx, by, bx + 6, by);
          ctx.closePath();
          ctx.fill();

          /* Triangle pointer */
          ctx.beginPath();
          ctx.moveTo(screenX - 5, by + bh);
          ctx.lineTo(screenX, by + bh + 8);
          ctx.lineTo(screenX + 5, by + bh);
          ctx.closePath();
          ctx.fill();

          /* Border */
          ctx.strokeStyle = "rgba(233, 69, 96, 0.5)";
          ctx.lineWidth = 1;
          ctx.stroke();

          /* Text */
          ctx.fillStyle = "#e8e6e3";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(bubble.text, screenX, by + bh / 2);

          ctx.restore();
        },
      };
    }
  };

  DR.Dialog = Dialog;
})();
