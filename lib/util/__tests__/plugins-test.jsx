/* eslint-disable import/first */

jest.mock('../fileUtil', () => {});

import React, { PropTypes } from 'react';
import { Provider } from 'react-redux';
import { setPlugin, decorate, connect } from '../plugins';
import renderer from 'react-test-renderer';

describe('decorate', () => {
    const FooComponent = ({ id }) => (
        <div id={id} />
    );
    FooComponent.propTypes = { id: PropTypes.string };
    FooComponent.defaultProps = { id: 'foo' };

    it('should render default component when plugin is not loaded', () => {
        setPlugin(null);
        const DecoratedFoo = decorate(FooComponent, 'Foo');
        const rendered = renderer.create(<DecoratedFoo />).toJSON();

        expect(rendered).toEqual({
            type: 'div',
            props: { id: 'foo' },
            children: null,
        });
    });

    it('should render default component when plugin does not implement decorate method', () => {
        setPlugin({});
        const DecoratedFoo = decorate(FooComponent, 'Foo');
        const rendered = renderer.create(<DecoratedFoo />).toJSON();

        expect(rendered).toEqual({
            type: 'div',
            props: { id: 'foo' },
            children: null,
        });
    });

    it('should throw error when decorate method is not a function', () => {
        setPlugin({
            decorateFoo: {},
        });
        expect(decorate(FooComponent, 'Foo')).toThrow(/not a function/);
    });

    it('should throw error when decorate method returns null', () => {
        setPlugin({
            decorateFoo: () => null,
        });
        expect(decorate(FooComponent, 'Foo')).toThrow(/No React component found/);
    });

    it('should throw error when decorate method returns an object', () => {
        setPlugin({
            decorateFoo: () => {},
        });
        expect(decorate(FooComponent, 'Foo')).toThrow(/No React component found/);
    });

    it('should render null when plugin decorates and returns null', () => {
        setPlugin({
            decorateFoo: () => (
                () => null
            ),
        });
        const DecoratedFoo = decorate(FooComponent, 'Foo');
        const rendered = renderer.create(<DecoratedFoo />).toJSON();

        expect(rendered).toEqual(null);
    });

    it('should render new element when plugin decorates and returns its own element', () => {
        setPlugin({
            decorateFoo: () => (
                () => <p>Foobar</p>
            ),
        });
        const DecoratedFoo = decorate(FooComponent, 'Foo');
        const rendered = renderer.create(<DecoratedFoo />).toJSON();

        expect(rendered).toEqual({
            type: 'p',
            props: {},
            children: ['Foobar'],
        });
    });

    it('should render component with new property value when plugin adds own value', () => {
        setPlugin({
            decorateFoo: Foo => (
                () => <Foo id="bar" />
            ),
        });
        const DecoratedFoo = decorate(FooComponent, 'Foo');
        const rendered = renderer.create(<DecoratedFoo />).toJSON();

        expect(rendered).toEqual({
            type: 'div',
            props: { id: 'bar' },
            children: null,
        });
    });

    it('should render with property when plugin uses a provided property', () => {
        setPlugin({
            decorateFoo: () => (
                props => <p id={props.bar} /> // eslint-disable-line react/prop-types
            ),
        });
        const DecoratedFoo = decorate(FooComponent, 'Foo');
        const rendered = renderer.create(<DecoratedFoo bar="baz" />).toJSON();

        expect(rendered).toEqual({
            type: 'p',
            props: { id: 'baz' },
            children: null,
        });
    });
});


describe('connect', () => {
    const FooComponent = ({ id, onClick }) => (
        <button id={id} onClick={onClick} />
    );
    FooComponent.propTypes = {
        id: PropTypes.string.isRequired,
        onClick: PropTypes.func.isRequired,
    };

    const defaultStateProps = { id: 'foo' };
    const defaultDispatchProps = { onClick: () => {} };
    const mapStateToProps = () => defaultStateProps;
    const mapDispatchToProps = () => defaultDispatchProps;

    // The react-redux connect function requires that a Provider component
    // has been rendered higher up in the component hierarchy. In our app
    // we do this in the Root container. We have to do the same when testing
    // containers.
    const storeFake = () => ({
        default: () => {},
        subscribe: () => {},
        dispatch: () => {},
        getState: () => {},
    });
    const renderWithProvider = Component => (
        renderer.create(
            <Provider store={storeFake()}>
                <Component />
            </Provider>,
        ).toJSON()
    );

    it('should render with default props when plugin is not loaded', () => {
        setPlugin(null);

        const ConnectedFoo = connect(
            mapStateToProps,
            mapDispatchToProps,
        )(FooComponent, 'Foo');

        expect(renderWithProvider(ConnectedFoo)).toEqual({
            type: 'button',
            props: {
                ...defaultStateProps,
                ...defaultDispatchProps,
            },
            children: null,
        });
    });

    it('should render with default props when plugin does not implement mapToProps functions', () => {
        setPlugin({});

        const ConnectedFoo = connect(
            mapStateToProps,
            mapDispatchToProps,
        )(FooComponent, 'Foo');

        expect(renderWithProvider(ConnectedFoo)).toEqual({
            type: 'button',
            props: {
                ...defaultStateProps,
                ...defaultDispatchProps,
            },
            children: null,
        });
    });

    it('should render with new state props when plugin implements mapStateToProps', () => {
        const pluginStateProps = { id: 'bar' };
        setPlugin({
            mapFooState: () => pluginStateProps,
        });

        const ConnectedFoo = connect(
            mapStateToProps,
            mapDispatchToProps,
        )(FooComponent, 'Foo');

        expect(renderWithProvider(ConnectedFoo)).toEqual({
            type: 'button',
            props: {
                ...pluginStateProps,
                ...defaultDispatchProps,
            },
            children: null,
        });
    });

    it('should render with new dispatch props when plugin implements mapDispatchToProps', () => {
        const pluginDispatchProps = { onClick: () => {} };
        setPlugin({
            mapFooDispatch: () => pluginDispatchProps,
        });

        const ConnectedFoo = connect(
            mapStateToProps,
            mapDispatchToProps,
        )(FooComponent, 'Foo');

        expect(renderWithProvider(ConnectedFoo)).toEqual({
            type: 'button',
            props: {
                ...defaultStateProps,
                ...pluginDispatchProps,
            },
            children: null,
        });
    });
});
