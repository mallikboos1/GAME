import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AutoErrorHealer, HealingReport } from '../game/diagnostics/AutoErrorHealer';
import { RotateCcw, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isHealing: boolean;
  lastReport: HealingReport | null;
}

export class ErrorBoundaryHealer extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isHealing: false,
    lastReport: null,
  };

  public static getDerivedStateFromError(): State {
    return {
      hasError: true,
      isHealing: true,
      lastReport: null,
    };
  }

  public async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const report = await AutoErrorHealer.reportAndHeal(
      error,
      `ReactErrorBoundary (${errorInfo.componentStack?.slice(0, 120) || 'Root'})`
    );

    // Automatically recover the component tree after remediation completes
    this.setState({
      hasError: false,
      isHealing: false,
      lastReport: report,
    });
  }

  private handleManualReset = () => {
    this.setState({ hasError: false, isHealing: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-slate-950 flex items-center justify-center p-6 text-center select-none">
          <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-black text-emerald-300">AUTOMATIC ERROR RECOVERY</h2>
            <p className="text-xs text-slate-300">
              {this.state.isHealing
                ? 'Analyzing anomaly and applying self-healing patch...'
                : this.state.lastReport?.fixSummary || 'State repaired.'}
            </p>
            <button
              onClick={this.handleManualReset}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Resume Game</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
