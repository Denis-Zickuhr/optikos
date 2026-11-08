import { Container } from '../../../core/container';
import { register } from '../../../core/registry';

export { Container, type ContainerConfig } from '../../../core/container';
register('container', Container);
