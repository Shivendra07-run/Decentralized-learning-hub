/**
 * AETHER WEB3 QUIZ & FLASHCARD STUDY CONTROLLER (IIFE + window.Aether)
 * 10 Comprehensive Questions with Instant Feedback,
 * Badge Categorization, 3D Flip Card Study Mode, and LocalStorage Best Score Persistence.
 */

(function () {
  'use strict';

  window.Aether = window.Aether || {};

  var QUESTIONS = [
    {
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
      category: 'CONSENSUS MECHANISMS',
      question: 'In a Proof-of-Stake (PoS) network like modern Ethereum, what secures the blockchain against fraudulent blocks?',
      options: [
        'Validators solve high-wattage thermodynamic puzzles using supercomputers',
        'Validators lock up native tokens as economic collateral that gets slashed (destroyed) if they act dishonestly',
        'A single lead server elected by national governments signs each block',
        'Users solve CAPTCHA puzzles before submitting payments'
      ],
      correct: 1,
      explanation: 'Proof-of-Stake relies on financial collateral (slashing). Malicious validators lose their deposited capital if they attempt to sign conflicting historical records.'
    },
    {
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

  var currentQuestionIndex = 0;
  var currentScore = 0;
  var answeredThisQuestion = false;
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
      badge.textContent = best > 0 ? (best + ' / ' + QUESTIONS.length) : '-- / 10';
    }
  }

  function renderCurrentQuestion() {
    answeredThisQuestion = false;

    var q = QUESTIONS[currentQuestionIndex];
    var stepEl = document.getElementById('quiz-step-indicator');
    var scoreLiveEl = document.getElementById('quiz-score-live');
    var fillEl = document.getElementById('quiz-progress-fill');
    var catEl = document.getElementById('quiz-category-tag');
    var textEl = document.getElementById('quiz-question-text');
    var optionsGroup = document.getElementById('quiz-options-group');
    var feedbackBox = document.getElementById('quiz-feedback-box');
    var nextBtn = document.getElementById('btn-quiz-next');

    if (stepEl) stepEl.textContent = 'Question ' + (currentQuestionIndex + 1) + ' of ' + QUESTIONS.length;
    if (scoreLiveEl) scoreLiveEl.textContent = 'Score: ' + currentScore;
    if (fillEl) fillEl.style.width = (((currentQuestionIndex + 1) / QUESTIONS.length) * 100) + '%';
    if (catEl) catEl.textContent = q.category;
    if (textEl) textEl.textContent = q.question;
    if (feedbackBox) feedbackBox.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';

    var letters = ['A', 'B', 'C', 'D'];

    if (optionsGroup) {
      optionsGroup.innerHTML = q.options.map(function (optText, idx) {
        return [
          '<div class="quiz-option-card" role="radio" aria-checked="false" tabindex="0" data-opt-idx="' + idx + '">',
          '  <span class="opt-letter">' + letters[idx] + '</span>',
          '  <span class="opt-text">' + optText + '</span>',
          '</div>'
        ].join('');
      }).join('');

      var optionCards = Array.from(optionsGroup.querySelectorAll('.quiz-option-card'));

      optionCards.forEach(function (card, idx) {
        function choose() {
          if (answeredThisQuestion) return;
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
    answeredThisQuestion = true;

    var optionCards = document.querySelectorAll('.quiz-option-card');
    var isCorrect = (selectedIdx === q.correct);

    if (isCorrect) {
      currentScore++;
      var scoreLiveEl = document.getElementById('quiz-score-live');
      if (scoreLiveEl) scoreLiveEl.textContent = 'Score: ' + currentScore;
    }

    optionCards.forEach(function (card, idx) {
      card.setAttribute('tabindex', '-1');
      if (idx === q.correct) {
        card.classList.add('is-correct');
      } else if (idx === selectedIdx && !isCorrect) {
        card.classList.add('is-wrong');
      }
    });

    // Feedback Callout
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
    if (explainerEl) explainerEl.textContent = q.explanation;

    var nextBtn = document.getElementById('btn-quiz-next');
    if (nextBtn) {
      nextBtn.style.display = 'inline-flex';
      nextBtn.focus();
      if (currentQuestionIndex === QUESTIONS.length - 1) {
        nextBtn.innerHTML = '<span>View Final Results &rarr;</span>';
      } else {
        nextBtn.innerHTML = '<span>Next Question &rarr;</span>';
      }
    }
  }

  function showResults() {
    saveBestScore(currentScore);
    updateBestScoreUI();

    var questionView = document.getElementById('quiz-question-view');
    var resultsView = document.getElementById('quiz-results-view');
    var progressWrap = document.querySelector('.quiz-progress-bar-wrap');

    if (questionView) questionView.style.display = 'none';
    if (progressWrap) progressWrap.style.display = 'none';
    if (resultsView) resultsView.style.display = 'block';

    var pct = Math.round((currentScore / QUESTIONS.length) * 100);
    var accuracyEl = document.getElementById('results-accuracy');
    var countEl = document.getElementById('results-correct-count');
    var bestEl = document.getElementById('results-best-alltime');
    var subtextEl = document.getElementById('results-subtext');
    var pillEl = document.getElementById('results-level-pill');
    var iconEl = document.getElementById('results-trophy-icon');

    if (accuracyEl) accuracyEl.textContent = pct + '%';
    if (countEl) countEl.textContent = currentScore + ' / ' + QUESTIONS.length;
    if (bestEl) bestEl.textContent = getBestScore() + ' / ' + QUESTIONS.length;
    if (subtextEl) subtextEl.textContent = 'You answered ' + currentScore + ' of ' + QUESTIONS.length + ' questions accurately.';

    // Badge tier logic
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
  }

  function restartQuiz() {
    currentQuestionIndex = 0;
    currentScore = 0;
    answeredThisQuestion = false;

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
   */
  function renderStudyCards() {
    var container = document.getElementById('study-cards-container');
    if (!container) return;

    container.innerHTML = QUESTIONS.map(function (q, idx) {
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
    renderCurrentQuestion();

    var nextBtn = document.getElementById('btn-quiz-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (currentQuestionIndex < QUESTIONS.length - 1) {
          currentQuestionIndex++;
          renderCurrentQuestion();
        } else {
          showResults();
        }
      });
    }

    var retryBtn = document.getElementById('btn-quiz-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', restartQuiz);
    }

    var btnQuizMode = document.getElementById('btn-mode-quiz');
    var btnStudyMode = document.getElementById('btn-mode-study');

    if (btnQuizMode) btnQuizMode.addEventListener('click', function () { setMode('quiz'); });
    if (btnStudyMode) btnStudyMode.addEventListener('click', function () { setMode('study'); });
  }

  window.Aether.Quiz = {
    init: init,
    setMode: setMode,
    restart: restartQuiz
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
