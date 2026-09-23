/**
 * AETHER WEB3 QUIZ & FLASHCARD STUDY CONTROLLER (IIFE + window.Aether)
 * Server-scored assessment with resilient offline fallback,
 * live leaderboard integration, 3D flip card study mode, and wallet authentication.
 */

(function () {
  'use strict';

  window.Aether = window.Aether || {};

  var DEFAULT_QUESTIONS = [
    {
      id: 1,
      category: 'BLOCKCHAIN FOUNDATIONS',
      question: 'What fundamentally prevents past transactions from being altered on a blockchain?',
      options: [
        'A centralized bank administrator locks the database at midnight',
        'Each block includes the cryptographic hash of the previous block, creating an unbroken mathematical chain',
        'Federal digital copyright regulations make editing records illegal',
        'The network automatically erases transaction history every 24 hours'
      ],
      correct: 1,
      explanation: 'Every block seals the cryptographic hash of the prior block; changing any historical record alters its hash and immediately breaks all downstream blocks.'
    },
    {
      id: 2,
      category: 'DECENTRALIZATION',
      question: 'What is the primary architectural advantage of a decentralized network over client-server Web2?',
      options: [
        'Transactions execute faster than centralized relational databases',
        'There is no single point of failure and no single authority can unilaterally censor valid transactions',
        'Users are guaranteed 100% anonymous internet browsing everywhere',
        'Customer support can reverse accidental payments upon phone request'
      ],
      correct: 1,
      explanation: 'Decentralization distributes validation across independent nodes globally, ensuring uptime even if hundreds of servers crash or disconnect.'
    },
    {
      id: 3,
      category: 'CRYPTOCURRENCY',
      question: 'In self-custody cryptocurrency, what gives you the mathematical ability to spend funds?',
      options: [
        'Your public wallet address',
        'A username and password saved on a company server',
        'Your private cryptographic key',
        'A government-issued digital ID number'
      ],
      correct: 2,
      explanation: 'Your private key creates verifiable cryptographic ECDSA signatures that prove ownership without disclosing the secret key itself.'
    },
    {
      id: 4,
      category: 'SMART CONTRACTS',
      question: 'Why are smart contracts commonly compared to a digital vending machine?',
      options: [
        'They only sell digital food and beverage vouchers',
        'They run deterministically according to embedded code conditions without requiring a middleman',
        'They require continuous human cashier verification for each transaction',
        'They can be updated and rewritten at any time by company executives'
      ],
      correct: 1,
      explanation: 'Smart contracts autonomously hold and transfer digital assets once predefined mathematical parameters are fulfilled, removing intermediary escrow.'
    },
    {
      id: 5,
      category: 'NFTS & DIGITAL ASSETS',
      question: 'How does an NFT (Non-Fungible Token) differ from a standard token like ETH or USDC?',
      options: [
        'NFTs can only be minted by certified governmental museums',
        'Each NFT has a unique cryptographic identifier and cannot be swapped 1:1 for another identical item',
        'NFTs do not require gas fees to trade or transfer',
        'NFTs automatically delete themselves after 30 days'
      ],
      correct: 1,
      explanation: 'Fungible tokens are interchangeable (one dollar equals another dollar); an NFT represents a unique, non-interchangeable digital item or contract right.'
    },
    {
      id: 6,
      category: 'DAO GOVERNANCE',
      question: 'How do members in a standard Decentralized Autonomous Organization (DAO) cast votes?',
      options: [
        'Through secret corporate boardroom committee meetings',
        'By signing on-chain transactions weighted by their governance token holdings',
        'By sending email petitions to the protocol founders',
        'One physical vote per registered passport submitted via mail'
      ],
      correct: 1,
      explanation: 'DAO governance proposals are voted on transparently on-chain using cryptographic governance tokens to signal consensus and release treasury funds.'
    },
    {
      id: 7,
      category: 'WALLET SECURITY',
      question: 'If a Discord direct message, telegram admin, or website asks for your 12-word recovery seed phrase, what should you do?',
      options: [
        'Provide only the first 6 words to verify your identity safely',
        'Never share it under any circumstances—it is an outright phishing scam',
        'Share it if the website has a valid SSL padlock in the address bar',
        'Enter it into a Google Form to receive customer support assistance'
      ],
      correct: 1,
      explanation: 'Your seed phrase controls all your private keys. Real teams and wallet providers will never request it; anyone with your phrase can steal all your assets permanently.'
    },
    {
      id: 8,
      category: 'GAS & NETWORK ECONOMICS',
      question: 'Why do public blockchains require users to pay "gas fees" on transactions?',
      options: [
        'To pay corporate sales tax to local municipal governments',
        'To compensate network validators for compute power and deter denial-of-service spam attacks',
        'To fund the electric utility bills of browser developers',
        'To purchase cloud storage licenses from Amazon Web Services'
      ],
      correct: 1,
      explanation: 'Gas meters computational resource usage, incentivizes decentralized validator participation, and prevents malicious actors from flooding the ledger with infinite loops.'
    },
    {
      id: 9,
      category: 'CONSENSUS MECHANISMS',
      question: 'In a Proof-of-Stake (PoS) network like modern Ethereum, what secures the blockchain against fraudulent blocks?',
      options: [
        'Validators solve high-wattage thermodynamic puzzles using supercomputers',
        'Validators lock up native tokens as economic collateral that gets slashed (destroyed) if they act dishonestly',
        'A single lead server elected by national governments signs each block',
        'Users solve CAPTCHA puzzles before submitting payments'
      ],
      correct: 1,
      explanation: 'Proof-of-Stake relies on financial collateral (slashing). Malicious validators lose their deposited capital if they act dishonestly.'
    },
    {
      id: 10,
      category: 'IMMUTABILITY & SAFETY',
      question: 'What happens if you mistakenly send cryptocurrency to the wrong address on a public blockchain?',
      options: [
        'The blockchain customer support team will reverse the transaction within 3 business days',
        'Your commercial bank will initiate a chargeback and retrieve your tokens',
        'The transaction is permanently irreversible unless the recipient voluntarily returns the funds',
        'The tokens automatically bounce back to your wallet after 24 hours'
      ],
      correct: 2,
      explanation: 'Public blockchains have no central administrative authority or undo button; transactions are permanent and final once confirmed in a block.'
    }
  ];

  var questions = DEFAULT_QUESTIONS;
  var isApiMode = false;
  var currentQuestionIndex = 0;
  var currentScore = 0;
  var userAnswers = []; // [{ id, choice }]
  var isSubmitting = false;
  var currentMode = 'quiz'; // 'quiz' or 'study'

  function getBestScore() {
    try {
      return parseInt(localStorage.getItem('aether_quiz_best_score') || '0', 10);
    } catch (e) {
      return 0;
    }
  }

  function saveBestScore(score) {
    try {
      var prev = getBestScore();
      if (score > prev) {
        localStorage.setItem('aether_quiz_best_score', score.toString());
      }

      // Sync with home page roadmap checklist item q1
      if (score >= 7) {
        var roadmap = {};
        try {
          roadmap = JSON.parse(localStorage.getItem('aether_chain_roadmap') || '{}');
        } catch (e) {}
        roadmap['q1'] = true;
        localStorage.setItem('aether_chain_roadmap', JSON.stringify(roadmap));
      }
    } catch (e) {}
  }

  function updateBestScoreUI() {
    var badge = document.getElementById('quiz-best-score-val');
    var best = getBestScore();
    if (badge) {
      badge.textContent = best > 0 ? (best + ' / ' + questions.length) : '-- / 10';
    }
  }

  function updateApiStatusBadge(isOnline) {
    var badge = document.getElementById('quiz-api-status-badge');
    var text = document.getElementById('quiz-api-status-text');
    if (!badge || !text) return;

    if (isOnline) {
      badge.className = 'quiz-api-status-badge';
      text.textContent = 'Live API';
    } else {
      badge.className = 'quiz-api-status-badge offline';
      text.textContent = 'Offline mode';
    }
  }

  async function loadQuestionsFromApi() {
    if (!window.Aether.api) {
      questions = DEFAULT_QUESTIONS;
      isApiMode = false;
      updateApiStatusBadge(false);
      renderCurrentQuestion();
      return;
    }

    try {
      var res = await window.Aether.api.get('/api/quiz/questions');
      if (res && res.ok && res.data && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
        questions = res.data.questions;
        isApiMode = true;
        updateApiStatusBadge(true);
      } else {
        questions = DEFAULT_QUESTIONS;
        isApiMode = false;
        updateApiStatusBadge(false);
      }
    } catch (err) {
      questions = DEFAULT_QUESTIONS;
      isApiMode = false;
      updateApiStatusBadge(false);
    }

    renderCurrentQuestion();
  }

  function renderCurrentQuestion() {
    var q = questions[currentQuestionIndex];
    if (!q) return;

    var stepEl = document.getElementById('quiz-step-indicator');
    var scoreLiveEl = document.getElementById('quiz-score-live');
    var fillEl = document.getElementById('quiz-progress-fill');
    var catEl = document.getElementById('quiz-category-tag');
    var textEl = document.getElementById('quiz-question-text');
    var optionsGroup = document.getElementById('quiz-options-group');
    var feedbackBox = document.getElementById('quiz-feedback-box');
    var nextBtn = document.getElementById('btn-quiz-next');

    if (stepEl) stepEl.textContent = 'Question ' + (currentQuestionIndex + 1) + ' of ' + questions.length;
    if (scoreLiveEl) scoreLiveEl.textContent = 'Question ' + (currentQuestionIndex + 1) + ' / ' + questions.length;
    if (fillEl) fillEl.style.width = (((currentQuestionIndex + 1) / questions.length) * 100) + '%';
    if (catEl) catEl.textContent = q.category;
    if (textEl) textEl.textContent = q.question;
    if (feedbackBox) feedbackBox.style.display = 'none';

    var existingAnswer = userAnswers[currentQuestionIndex];
    if (nextBtn) {
      if (existingAnswer !== undefined) {
        nextBtn.style.display = 'inline-flex';
        nextBtn.disabled = false;
        if (currentQuestionIndex === questions.length - 1) {
          nextBtn.innerHTML = '<span>Submit &amp; View Results &rarr;</span>';
        } else {
          nextBtn.innerHTML = '<span>Next Question &rarr;</span>';
        }
      } else {
        nextBtn.style.display = 'none';
      }
    }

    var letters = ['A', 'B', 'C', 'D'];

    if (optionsGroup) {
      optionsGroup.innerHTML = q.options.map(function (optText, idx) {
        var isSelected = existingAnswer && existingAnswer.choice === idx;
        return [
          '<div class="quiz-option-card' + (isSelected ? ' is-selected' : '') + '" role="radio" aria-checked="' + (isSelected ? 'true' : 'false') + '" tabindex="0" data-opt-idx="' + idx + '">',
          '  <span class="opt-letter">' + letters[idx] + '</span>',
          '  <span class="opt-text">' + optText + '</span>',
          '</div>'
        ].join('');
      }).join('');

      var optionCards = Array.from(optionsGroup.querySelectorAll('.quiz-option-card'));

      optionCards.forEach(function (card, idx) {
        function choose() {
          selectAnswer(idx, q);
        }

        card.addEventListener('click', choose);

        card.addEventListener('keydown', function (e) {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            choose();
          } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            var nextIdx = (idx + 1) % optionCards.length;
            optionCards[nextIdx].focus();
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            var prevIdx = (idx - 1 + optionCards.length) % optionCards.length;
            optionCards[prevIdx].focus();
          }
        });
      });
    }
  }

  function selectAnswer(selectedIdx, q) {
    userAnswers[currentQuestionIndex] = {
      id: q.id,
      choice: selectedIdx
    };

    var optionCards = document.querySelectorAll('.quiz-option-card');
    optionCards.forEach(function (card, idx) {
      if (idx === selectedIdx) {
        card.classList.add('is-selected');
        card.setAttribute('aria-checked', 'true');
      } else {
        card.classList.remove('is-selected');
        card.setAttribute('aria-checked', 'false');
      }
    });

    // In offline mode with local answer keys, provide instant feedback
    if (!isApiMode && typeof q.correct === 'number') {
      var isCorrect = (selectedIdx === q.correct);
      optionCards.forEach(function (card, idx) {
        if (idx === q.correct) {
          card.classList.add('is-correct');
        } else if (idx === selectedIdx && !isCorrect) {
          card.classList.add('is-wrong');
        }
      });

      var feedbackBox = document.getElementById('quiz-feedback-box');
      var badgeEl = document.getElementById('feedback-badge');
      var headlineEl = document.getElementById('feedback-headline');
      var explainerEl = document.getElementById('feedback-explainer');

      if (feedbackBox) {
        feedbackBox.style.display = 'block';
        feedbackBox.className = 'quiz-feedback-box ' + (isCorrect ? 'quiz-feedback--correct' : 'quiz-feedback--wrong');
      }
      if (badgeEl) badgeEl.textContent = isCorrect ? 'Correct' : 'Incorrect';
      if (headlineEl) headlineEl.textContent = isCorrect ? 'Well done!' : 'Not quite.';
      if (explainerEl) explainerEl.textContent = q.explanation || '';
    }

    var nextBtn = document.getElementById('btn-quiz-next');
    if (nextBtn) {
      nextBtn.style.display = 'inline-flex';
      nextBtn.disabled = false;
      nextBtn.focus();
      if (currentQuestionIndex === questions.length - 1) {
        nextBtn.innerHTML = '<span>Submit &amp; View Results &rarr;</span>';
      } else {
        nextBtn.innerHTML = '<span>Next Question &rarr;</span>';
      }
    }
  }

  async function handleNextOrSubmit() {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      renderCurrentQuestion();
    } else {
      await submitQuiz();
    }
  }

  async function submitQuiz() {
    if (isSubmitting) return;
    isSubmitting = true;

    var nextBtn = document.getElementById('btn-quiz-next');
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.innerHTML = '<span>Evaluating on server...</span>';
    }

    var answersPayload = userAnswers.map(function (item) {
      return { id: item.id, choice: item.choice };
    });

    // Try server-side scoring if API helper exists
    if (window.Aether.api) {
      try {
        var res = await window.Aether.api.post('/api/quiz/submit', { answers: answersPayload });
        if (res && res.ok && res.data && typeof res.data.score === 'number') {
          isSubmitting = false;
          showResults(res.data.score, res.data.total || questions.length, false);
          return;
        }
      } catch (err) {
        // Fall back to client-side scoring
      }
    }

    // Offline / fallback local evaluation against DEFAULT_QUESTIONS
    var localScore = 0;
    answersPayload.forEach(function (ans) {
      var dq = DEFAULT_QUESTIONS.find(function (q) { return q.id === ans.id; });
      if (dq && ans.choice === dq.correct) {
        localScore++;
      }
    });

    isSubmitting = false;
    showResults(localScore, DEFAULT_QUESTIONS.length, true);
  }

  function showResults(score, total, isOffline) {
    currentScore = score;
    saveBestScore(currentScore);
    updateBestScoreUI();

    var questionView = document.getElementById('quiz-question-view');
    var resultsView = document.getElementById('quiz-results-view');
    var progressWrap = document.querySelector('.quiz-progress-bar-wrap');

    if (questionView) questionView.style.display = 'none';
    if (progressWrap) progressWrap.style.display = 'none';
    if (resultsView) resultsView.style.display = 'block';

    var pct = Math.round((currentScore / total) * 100);
    var accuracyEl = document.getElementById('results-accuracy');
    var countEl = document.getElementById('results-correct-count');
    var bestEl = document.getElementById('results-best-alltime');
    var subtextEl = document.getElementById('results-subtext');
    var pillEl = document.getElementById('results-level-pill');
    var iconEl = document.getElementById('results-trophy-icon');

    if (accuracyEl) accuracyEl.textContent = pct + '%';
    if (countEl) countEl.textContent = currentScore + ' / ' + total;
    if (bestEl) bestEl.textContent = getBestScore() + ' / ' + total;
    if (subtextEl) subtextEl.textContent = 'You answered ' + currentScore + ' of ' + total + ' questions accurately.';

    // Tier calculation & celebratory sound/visuals
    var tierTitle = 'Curious Explorer';
    var icon = '🌱';
    if (currentScore >= 8) {
      tierTitle = 'Decentralized Master';
      icon = '🏆';
      if (window.Aether && window.Aether.scene3d && typeof window.Aether.scene3d.triggerSuccessEffect === 'function') {
        window.Aether.scene3d.triggerSuccessEffect();
      }
    } else if (currentScore >= 5) {
      tierTitle = 'Knowledge Builder';
      icon = '⚡';
    }

    if (pillEl) pillEl.textContent = tierTitle;
    if (iconEl) iconEl.textContent = icon;

    // Save Status Indicator
    var saveStatusPill = document.getElementById('quiz-save-status-pill');
    if (saveStatusPill) {
      saveStatusPill.style.display = 'inline-flex';
      if (isOffline) {
        saveStatusPill.className = 'quiz-save-status-pill offline';
        saveStatusPill.textContent = 'not saved (offline)';
      } else {
        var isUserAuth = Boolean(window.Aether.Wallet && window.Aether.Wallet.getAuthState().isSignedIn);
        saveStatusPill.className = 'quiz-save-status-pill saved';
        saveStatusPill.textContent = isUserAuth ? '✓ Score saved to leaderboard' : '✓ Score saved anonymously';
      }
    }

    // Wallet Auth Prompt
    updateAuthPromptUI();

    // Fetch and render verified server leaderboard
    fetchAndRenderLeaderboard();
  }

  function updateAuthPromptUI() {
    var promptCard = document.getElementById('quiz-auth-prompt-card');
    if (!promptCard) return;

    var isSignedIn = Boolean(window.Aether.Wallet && window.Aether.Wallet.getAuthState().isSignedIn);
    if (!isSignedIn) {
      promptCard.style.display = 'flex';
      var signinBtn = document.getElementById('btn-quiz-signin');
      if (signinBtn) {
        signinBtn.onclick = function () {
          if (window.Aether.Wallet) {
            var state = window.Aether.Wallet.getState();
            if (!state.isConnected) {
              window.Aether.Wallet.openModal();
            } else {
              window.Aether.Wallet.signIn();
            }
          }
        };
      }
    } else {
      promptCard.style.display = 'none';
    }
  }

  async function fetchAndRenderLeaderboard() {
    var listContainer = document.getElementById('leaderboard-list');
    var userBestContainer = document.getElementById('leaderboard-user-best');
    var statusBadge = document.getElementById('leaderboard-status-badge');
    var statusText = document.getElementById('leaderboard-status-text');

    if (!listContainer) return;

    if (!window.Aether.api) {
      if (statusBadge) statusBadge.style.display = 'none';
      listContainer.innerHTML = '<div class="leaderboard-empty-msg">Leaderboard unavailable in offline mode.</div>';
      return;
    }

    try {
      var res = await window.Aether.api.get('/api/quiz/leaderboard');
      if (res && res.ok && res.data) {
        if (statusText) statusText.textContent = 'Live';

        // Render caller's best score if present
        if (userBestContainer) {
          if (res.data.userBest) {
            userBestContainer.style.display = 'flex';
            userBestContainer.innerHTML = [
              '<div><strong>Your Best:</strong> Rank #' + res.data.userBest.rank + ' &bull; ' + res.data.userBest.score + ' / ' + res.data.userBest.total + '</div>',
              '<div style="font-family:var(--font-mono);font-size:11px;opacity:0.8;">' + res.data.userBest.address + '</div>'
            ].join('');
          } else {
            userBestContainer.style.display = 'none';
          }
        }

        // Render Top 10 list
        var leaderboard = res.data.leaderboard || [];
        if (leaderboard.length === 0) {
          listContainer.innerHTML = '<div class="leaderboard-empty-msg">No saved scores yet. Sign in and take the quiz to get on the board!</div>';
        } else {
          listContainer.innerHTML = leaderboard.map(function (item) {
            var isUser = res.data.userBest && res.data.userBest.address === item.address;
            var rankClass = item.rank <= 3 ? ' rank-' + item.rank : '';
            return [
              '<div class="leaderboard-row' + (isUser ? ' is-current-user' : '') + '">',
              '  <div class="leaderboard-row-left">',
              '    <span class="leaderboard-rank-pill' + rankClass + '">#' + item.rank + '</span>',
              '    <span class="leaderboard-addr">' + item.address + (isUser ? ' (You)' : '') + '</span>',
              '  </div>',
              '  <span class="leaderboard-score-val">' + item.score + ' / ' + item.total + '</span>',
              '</div>'
            ].join('');
          }).join('');
        }
      } else {
        if (statusText) statusText.textContent = 'Offline';
        if (userBestContainer) userBestContainer.style.display = 'none';
        listContainer.innerHTML = '<div class="leaderboard-empty-msg">Leaderboard unavailable in offline mode.</div>';
      }
    } catch (err) {
      if (statusText) statusText.textContent = 'Offline';
      if (userBestContainer) userBestContainer.style.display = 'none';
      listContainer.innerHTML = '<div class="leaderboard-empty-msg">Leaderboard unavailable in offline mode.</div>';
    }
  }

  function restartQuiz() {
    currentQuestionIndex = 0;
    currentScore = 0;
    userAnswers = [];
    isSubmitting = false;

    var questionView = document.getElementById('quiz-question-view');
    var resultsView = document.getElementById('quiz-results-view');
    var progressWrap = document.querySelector('.quiz-progress-bar-wrap');

    if (questionView) questionView.style.display = 'block';
    if (progressWrap) progressWrap.style.display = 'block';
    if (resultsView) resultsView.style.display = 'none';

    renderCurrentQuestion();
  }

  /**
   * Flashcard Study Mode Generation
   * Always renders complete explanations and answers from DEFAULT_QUESTIONS.
   */
  function renderStudyCards() {
    var container = document.getElementById('study-cards-container');
    if (!container) return;

    container.innerHTML = DEFAULT_QUESTIONS.map(function (q, idx) {
      var correctText = q.options[q.correct];
      return [
        '<div class="study-card-wrap" tabindex="0" role="button" aria-label="Flashcard ' + (idx + 1) + ': ' + q.question + '. Press Enter to flip.">',
        '  <div class="study-card-inner">',
        '    <!-- Front -->',
        '    <div class="study-card-face study-card-front">',
        '      <div class="study-card-head">',
        '        <span class="study-card-num">CARD ' + (idx + 1) + ' / 10</span>',
        '        <span class="study-card-hint">Click or press to flip</span>',
        '      </div>',
        '      <span class="study-card-cat">' + q.category + '</span>',
        '      <h3 class="study-card-q">' + q.question + '</h3>',
        '      <div class="study-card-options-peek">',
        '        <span>Contains 4 answer choices</span>',
        '      </div>',
        '    </div>',
        '    <!-- Back -->',
        '    <div class="study-card-face study-card-back">',
        '      <div class="study-card-head">',
        '        <span class="study-card-num">CARD ' + (idx + 1) + ' EXPLANATION</span>',
        '        <span class="study-card-verified">&#10003; Correct Answer</span>',
        '      </div>',
        '      <strong class="study-answer-text">' + correctText + '</strong>',
        '      <p class="study-explainer-text">' + q.explanation + '</p>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('');
    }).join('');

    // Flip interaction
    container.querySelectorAll('.study-card-wrap').forEach(function (card) {
      function flip() {
        card.classList.toggle('is-flipped');
      }
      card.addEventListener('click', flip);
      card.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          flip();
        }
      });
    });
  }

  function setMode(mode) {
    currentMode = mode;
    var btnQuiz = document.getElementById('btn-mode-quiz');
    var btnStudy = document.getElementById('btn-mode-study');
    var quizStage = document.getElementById('quiz-standard-stage');
    var studyStage = document.getElementById('study-cards-stage');

    if (mode === 'quiz') {
      if (btnQuiz) { btnQuiz.classList.add('is-active'); btnQuiz.setAttribute('aria-pressed', 'true'); }
      if (btnStudy) { btnStudy.classList.remove('is-active'); btnStudy.setAttribute('aria-pressed', 'false'); }
      if (quizStage) quizStage.style.display = 'block';
      if (studyStage) studyStage.style.display = 'none';
    } else {
      if (btnQuiz) { btnQuiz.classList.remove('is-active'); btnQuiz.setAttribute('aria-pressed', 'false'); }
      if (btnStudy) { btnStudy.classList.add('is-active'); btnStudy.setAttribute('aria-pressed', 'true'); }
      if (quizStage) quizStage.style.display = 'none';
      if (studyStage) studyStage.style.display = 'block';
      renderStudyCards();
    }
  }

  function init() {
    updateBestScoreUI();
    loadQuestionsFromApi();

    var nextBtn = document.getElementById('btn-quiz-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', handleNextOrSubmit);
    }

    var retryBtn = document.getElementById('btn-quiz-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', restartQuiz);
    }

    var btnQuizMode = document.getElementById('btn-mode-quiz');
    var btnStudyMode = document.getElementById('btn-mode-study');

    if (btnQuizMode) btnQuizMode.addEventListener('click', function () { setMode('quiz'); });
    if (btnStudyMode) btnStudyMode.addEventListener('click', function () { setMode('study'); });

    window.addEventListener('aether:authState', function () {
      updateAuthPromptUI();
      var resultsView = document.getElementById('quiz-results-view');
      if (resultsView && resultsView.style.display !== 'none') {
        fetchAndRenderLeaderboard();
      }
    });
  }

  window.Aether.Quiz = {
    init: init,
    setMode: setMode,
    restart: restartQuiz,
    submitQuiz: submitQuiz,
    fetchLeaderboard: fetchAndRenderLeaderboard
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
