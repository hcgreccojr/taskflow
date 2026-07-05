import { AuthForm } from '../components/AuthForm';
import styles from './AuthPage.module.css';

export function AuthPage() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <span className={styles.logo}>TaskFlow</span>
        <div className={styles.heroBody}>
          <p className={styles.kicker}>Gestão de tarefas colaborativa</p>
          <h1 className={styles.headline}>Organize o trabalho da sua equipe em um só lugar.</h1>
          <ul className={styles.bullets}>
            <li>Quadros e colunas customizáveis por organização</li>
            <li>Arraste tarefas entre etapas com histórico automático</li>
            <li>Comentários e atividade em tempo real por tarefa</li>
          </ul>
        </div>
        <span className={styles.version}>TaskFlow v1.0</span>
      </div>
      <div className={styles.formSide}>
        <div className={styles.formWrapper}>
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
