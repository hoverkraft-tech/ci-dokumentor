import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Automated Documentation',
    Svg: require('@site/static/img/automated-documentation.svg').default,
    description: (
      <>
        Generate comprehensive documentation automatically from your CI/CD configuration files.
        No manual work required - just point CI Dokumentor at your files and get professional docs.
      </>
    ),
  },
  {
    title: 'Professional Output',
    Svg: require('@site/static/img/professional-output.svg').default,
    description: (
      <>
        Generates comprehensive, professional documentation in Markdown format.
        Perfect for GitHub README files and documentation websites.
      </>
    ),
  },
  {
    title: 'Multiple Platforms',
    Svg: require('@site/static/img/multiple-platforms.svg').default,
    description: (
      <>
        Works with GitHub Actions, GitHub workflows, GitLab templates, GitLab components and Dagger modules.
        Available as NPM CLI tool, Docker image, GitHub Action, and GitLab component for flexible integration.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles['feature-svg']} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
